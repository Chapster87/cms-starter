import Logo from "./_components/logo"
import Text from "@components/typography/text"
import Link from "@components/link"
import s from "./styles.module.css"

const NAV = [
  {
    title: "Example",
    url: "/temp",
  },
]

export default function Header() {
  return (
    <>
      <div className={s.headerBanner}>
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
      </div>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Logo />
          <nav className={s.nav}>
            <ul className={s.navList}>
              {NAV.map((item) => (
                <li key={item.title}>
                  <Link href={item.url} className={s.navLink}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
