import Heading from "@components/typography/heading"
import AuthStatus from "./_components/auth-status"
import TitleBar from "./_components/title-bar"

import s from "./styles.module.css"

export default function Header() {
  return (
    <>
      {/* <div className={s.headerBanner}>
        <div>
          <svg
            className={`feather-icon ${s.bannerIcon}`}
            width="16"
            height="16"
          >
            <use href="../feather-sprite.svg#cpu" />
          </svg>
        </div>
        <Text className={s.bannerText}>Top Banner!</Text>
        <Link href="/temp" className={s.bannerLink}>
          Temp page Link
        </Link>
      </div> */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <Heading level="h1" display="h4" className={s.headerTitle}>
            CMS Starter
          </Heading>
        </div>
        <div className={s.headerRight}>
          <AuthStatus />
        </div>
      </header>
      <TitleBar />
    </>
  )
}
