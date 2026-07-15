/**
 * NEW: Querying Modular Content with Union Types
 * Replaces old JSON blobs with type-safe fragments.
 */
export const pagesWithUnionQuery = `
query PagesQuery($slug: String!) {
  pages(slug: $slug) {
    id
    title
    # Modular Content using the new Union Types
    modular_blocks {
      __typename
      ... on TestBlock {
        zxcv
      }
      ... on Test2Block {
        league {
          name
          short_name
        }
      }
    }
    # Structured Text using the new object type
    structured_text {
      value # Raw JSON for the editor
      blocks {
        __typename
        ... on TestBlock {
          zxcv
        }
      }
    }
  }
}
`

export const teamsQuery = ` 
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

export const standingsQuery = `
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
