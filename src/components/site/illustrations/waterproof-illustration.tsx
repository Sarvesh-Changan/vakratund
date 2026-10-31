import { cn } from "@/lib/utils";
import { IllustrationCanvas } from "./illustration-canvas";
import styles from "./illustration-canvas.module.css";

export function WaterproofIllustration({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return <IllustrationCanvas className={className} ariaLabel="Illustration of terrace waterproofing work" description="Blueprint-style terrace scene with waterproofing layers, a roller, and a water drop." decorative={decorative}>
    <rect width="800" height="600" className={styles.tintFill} />
    <g className={styles.gridLine}><path d="M72 80H728M72 120H728M72 160H728M72 200H728M72 240H728M72 280H728M72 320H728M72 360H728M72 400H728M72 440H728M72 480H728M72 520H728" /><path d="M80 65V535M120 65V535M160 65V535M200 65V535M240 65V535M280 65V535M320 65V535M360 65V535M400 65V535M440 65V535M480 65V535M520 65V535M560 65V535M600 65V535M640 65V535M680 65V535M720 65V535" /></g>
    <path d="M100 516H700" className={styles.mintLine} />
    <path d="M142 465V254H315V465M142 300H315M142 354H315M142 408H315M142 465H315" className={styles.linework} />
    <path d="M166 276H290V294H166ZM166 330H290V348H166ZM166 384H290V402H166Z" className={styles.surfaceFill} />
    <path d="M312 250L612 330V385L312 305Z" className={cn(styles.surfaceFill, styles.linework)} />
    <path d="M312 305L612 385V405L312 325Z" className={styles.solidAccent} />
    <path d="M312 325L612 405V425L312 345Z" className={styles.solidMint} />
    <path d="M312 250V345M612 330V425M312 250H612" className={styles.fineLine} />
    <path d="M390 352L411 306M432 364L453 318M474 375L495 330" className={styles.fineLine} />
    <path d="M513 140C513 140 477 183 477 211A36 36 0 1 0 549 211C549 183 513 140 513 140Z" className={cn(styles.solidMint, styles.linework)} />
    <path d="M503 207C503 194 513 182 513 182" className={styles.accentLine} />
    <path d="M500 256V289M500 289L491 278M500 289L509 278" className={styles.accentLine} />
    <path d="M365 214H438M365 214V233M438 214V233" className={styles.fineLine} />
    <path d="M352 205L365 214L352 223M451 205L438 214L451 223" className={styles.mintLine} />
    <circle cx="365" cy="214" r="6" className={styles.solidAccent} />
    <circle cx="438" cy="214" r="6" className={styles.solidAccent} />
  </IllustrationCanvas>;
}

