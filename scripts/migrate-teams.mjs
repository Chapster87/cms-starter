import { createClient } from "@supabase/supabase-js"
import ws from "ws"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const wpUrl = process.env.WORDPRESS_URL

if (!supabaseUrl || !supabaseKey || !wpUrl) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
})

const isTest = process.argv.includes("--test")

/**
 * Clean HTML entities from string
 */
function cleanString(str) {
  if (!str) return ""
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
}

async function runMigration() {
  console.log(`Starting migration... ${isTest ? "(TEST RUN)" : "(FULL RUN)"}`)

  // 1. Fetch Supabase Lookup Data
  console.log("Fetching Supabase lookup data...")
  const { data: leaguesSB } = await supabase
    .from("leagues")
    .select("id, name, slug")
  const { data: divisionsSB } = await supabase
    .from("divisions")
    .select("id, name, slug")

  // 2. Fetch WordPress Terms for mapping
  console.log("Fetching WordPress league terms...")
  const wpLeaguesUrl = `${wpUrl}/wp-json/sportspress/v2/leagues?per_page=100`
  const wpLeagues = await fetch(wpLeaguesUrl).then((r) => r.json())

  /**
   * Mapping Logic
   * We need to determine League SB IDs and Division SB IDs based on WP League IDs
   */
  const getMappings = (wpLeagueIds) => {
    const leagueIds = new Set()
    const divisionIds = new Set()

    if (!wpLeagueIds || !Array.isArray(wpLeagueIds))
      return { leagueIds: [], divisionIds: [] }

    for (const id of wpLeagueIds) {
      const wpLeague = wpLeagues.find((l) => l.id === id)
      if (!wpLeague) continue

      const name = wpLeague.name.toLowerCase()

      // Determine League
      if (name.includes("men")) {
        const found = leaguesSB.find((l) => l.name.includes("Men"))?.id
        if (found) leagueIds.add(found)
      } else if (name.includes("women")) {
        const found = leaguesSB.find((l) => l.name.includes("Women"))?.id
        if (found) leagueIds.add(found)
      }

      // Determine Division
      if (name.includes("d1") || name.includes("premiership")) {
        const found = divisionsSB.find(
          (d) => d.name.includes("Premiership") || d.slug === "div_1"
        )?.id
        if (found) divisionIds.add(found)
      } else if (name.includes("d2")) {
        const found = divisionsSB.find(
          (d) => d.name.includes("2") || d.slug.includes("2")
        )?.id
        if (found) divisionIds.add(found)
      } else if (name.includes("d3")) {
        const found = divisionsSB.find(
          (d) => d.name.includes("3") || d.slug.includes("3")
        )?.id
        if (found) divisionIds.add(found)
      } else if (name.includes("d4")) {
        const found = divisionsSB.find(
          (d) => d.name.includes("4") || d.slug.includes("4")
        )?.id
        if (found) divisionIds.add(found)
      }
    }

    return {
      leagueIds: Array.from(leagueIds),
      divisionIds: Array.from(divisionIds),
    }
  }

  // 3. Fetch WordPress Teams
  console.log("Fetching WordPress teams...")
  const wpTeamsUrl = `${wpUrl}/wp-json/sportspress/v2/teams?per_page=100`
  let wpTeams = await fetch(wpTeamsUrl).then((r) => r.json())

  if (isTest) {
    console.log("Subsetting data for test run...")
    const mens = wpTeams
      .filter((t) => t.class_list?.some((c) => c.includes("men")))
      .slice(0, 2)
    const womens = wpTeams
      .filter((t) => t.class_list?.some((c) => c.includes("women")))
      .slice(0, 2)
    wpTeams = [...mens, ...womens]
  }

  console.log(`Processing ${wpTeams.length} teams...`)

  for (const wpTeam of wpTeams) {
    const teamName = cleanString(wpTeam.title?.rendered || wpTeam.slug)
    const { leagueIds, divisionIds } = getMappings(wpTeam.leagues)

    const teamData = {
      team_name: teamName,
      short_name: wpTeam.slug,
      league: leagueIds,
      division: divisionIds,
    }

    console.log(`Processing team: ${teamName}...`)

    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("team_name", teamName)
      .maybeSingle()

    if (existingTeam) {
      console.log(`Updating existing team: ${teamName}`)
      const { error } = await supabase
        .from("teams")
        .update(teamData)
        .eq("id", existingTeam.id)
      if (error) console.error(`Error updating ${teamName}:`, error.message)
    } else {
      console.log(`Inserting new team: ${teamName}`)
      const { error } = await supabase.from("teams").insert(teamData)
      if (error) console.error(`Error inserting ${teamName}:`, error.message)
    }
  }

  console.log("Migration completed.")
}

runMigration()
