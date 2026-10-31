import { cn } from "@/lib/utils";
import { IllustrationCanvas } from "./illustration-canvas";
import styles from "./illustration-canvas.module.css";

export function RepairIllustration({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  return <IllustrationCanvas className={className} ariaLabel="Illustration of a cracked column being strengthened" description="Blueprint-style repair scene with a cracked structural column, reinforcement bands, and a scaffold." decorative={decorative}>
    <rect width="800" height="600" className={styles.tintFill} />
    <g className={styles.gridLine}><path d="M72 80H728M72 120H728M72 160H728M72 200H728M72 240H728M72 280H728M72 320H728M72 360H728M72 400H728M72 440H728M72 480H728M72 520H728" /><path d="M80 65V535M120 65V535M160 65V535M200 65V535M240 65V535M280 65V535M320 65V535M360 65V535M400 65V535M440 65V535M480 65V535M520 65V535M560 65V535M600 65V535M640 65V535M680 65V535M720 65V535" /></g>
    <path d="M100 516H700" className={styles.mintLine} />
    <path d="M190 507V180M270 507V180M190 222H270M190 282H270M190 342H270M190 402H270M190 462H270M190 180L270 222M270 180L190 222M190 282L270 342M270 282L190 342M190 402L270 462M270 402L190 462" className={styles.linework} />
    <path d="M188 178H274M185 507H278" className={styles.accentLine} />
    <path d="M370 188H520V500H370Z" className={cn(styles.surfaceFill, styles.linework)} />
    <path d="M370 240H520M370 292H520M370 344H520M370 396H520M370 448H520" className={styles.fineLine} />
    <path d="M440 202L425 238L447 265L426 303L446 336L428 371L447 409L432 444L449 482" className={styles.accentLine} />
    <path d="M350 210H540V228H350ZM350 300H540V318H350ZM350 390H540V408H350ZM350 480H540V498H350Z" className={styles.solidMint} />
    <path d="M340 206V230M550 206V230M340 296V320M550 296V320M340 386V410M550 386V410M340 476V500M550 476V500" className={styles.linework} />
    <path d="M600 220V490M590 220H610M590 490H610M580 220H620M580 490H620" className={styles.fineLine} />
    <circle cx="600" cy="202" r="7" className={styles.solidAccent} />
    <path d="M600 500V514M585 514H615" className={styles.linework} />
  </IllustrationCanvas>;
}

