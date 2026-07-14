const teamsQuery = ` 
query teamsQuery { 
  teamsCollection {
    edges {
      node {
        team_name
        short_name
        # Resolved League record
        league {
          name
          short_name
        }
        # Resolved Division record (Polymorphic fix applied)
        division {
          name
          short_name
        }
        # Resolved Media Asset
        team_logo {
          url
          name
        }
      }
    }
  }
}
`

const standingsQuery = `
query StandingsQuery {
  standingsCollection(
    where: {league: {slug: "midwest-mens-rugby"}, division: {slug: "div_1"}, season: {year: 2025, season: "Fall"}}
  ) {
    edges {
      node {
        league {
          name
          slug
          short_name
        }
        season {
          year
          display_name
          season
        }
        division {
          short_name
          name
          slug
        }
        league_standings
      }
    }
  }
}
  `

const pagesQuery = `
  query PagesQuery {
  pagesCollection(
    where: {slug: "hgfj"}
  ) {
    edges {
      node {
        id
        title
        content_dynamic
        modular_blocks
        structured_text
      }
    }
  }
}
`
