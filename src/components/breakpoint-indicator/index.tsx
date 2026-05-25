import s from './styles.module.css';

export default function BreakpointIndicator() {
  return (
    process.env.NODE_ENV === "development" && (
      <div className={s.breakpointIndicator}>
        <span className={s.labelAll}>all</span>
        <span className={s.labelXxs}>xxs</span>
        <span className={s.labelXs}>xs</span>
        <span className={s.labelSm}>sm</span>
        <span className={s.labelMd}>md</span>
        <span className={s.labelLg}>lg</span>
        <span className={s.labelXl}>xl</span>
        <span className={s.label2xl}>2xl</span>
      </div>
    )
  )
}
