import { cn } from "@/lib/utils";
import { IllustrationCanvas } from "./illustration-canvas";
import styles from "./illustration-canvas.module.css";

export type AboutIllustrationProps = { className?: string; ariaLabel?: string; decorative?: boolean };

export function AboutIllustration({ className, ariaLabel = "Illustration of a building under construction with a crane", decorative = false }: AboutIllustrationProps) {
  return <IllustrationCanvas className={className} ariaLabel={ariaLabel} description="Illustration of a building under construction with a crane." decorative={decorative}>
    <rect width="800" height="600" className={styles.tintFill} />
    <g className={cn(styles.gridLine, styles.animatedLine)}>
      <path d="M72 70H728 M72 110H728 M72 150H728 M72 190H728 M72 230H728 M72 270H728 M72 310H728 M72 350H728 M72 390H728 M72 430H728 M72 470H728 M72 510H728" />
      <path d="M80 62V522 M120 62V522 M160 62V522 M200 62V522 M240 62V522 M280 62V522 M320 62V522 M360 62V522 M400 62V522 M440 62V522 M480 62V522 M520 62V522 M560 62V522 M600 62V522 M640 62V522 M680 62V522 M720 62V522" />
    </g>

    <path d="M82 514H718" className={cn(styles.mintLine, styles.animatedLine)} />
    <path d="M322 505V195M615 505V195M322 255H615M322 315H615M322 375H615M322 435H615M322 495H615" className={cn(styles.linework, styles.animatedLine)} />
    <path d="M322 255L615 315M615 255L322 315M322 315L615 375M615 315L322 375M322 375L615 435M615 375L322 435M322 435L615 495M615 435L322 495" className={cn(styles.fineLine, styles.animatedLine)} />

    <g className={styles.craneArm}>
      <path d="M246 145V505M232 505H260M246 160L224 190L246 220L224 250L246 280L224 310L246 340L224 370L246 400L224 430L246 460L224 490" className={cn(styles.linework, styles.animatedLine)} />
      <path d="M246 143H124L101 157H218M246 143H581L614 158H267" className={cn(styles.accentLine, styles.animatedLine)} />
      <path d="M143 143V128H183V143M218 143L246 127L267 143M290 143L246 127M330 143L246 127M370 143L246 127M410 143L246 127M450 143L246 127M490 143L246 127M530 143L246 127" className={cn(styles.fineLine, styles.animatedLine)} />
      <path d="M585 151V238M579 238H591L585 249L579 238" className={cn(styles.mintLine, styles.animatedLine)} />
      <rect x="198" y="146" width="36" height="25" rx="4" className={cn(styles.surfaceFill, styles.linework)} />
      <path d="M205 146V138H226V146" className={styles.fineLine} />
      <circle cx="246" cy="143" r="9" className={styles.solidMint} />
    </g>

    <g className={cn(styles.floor, styles.floorOne)}>
      <rect x="361" y="404" width="215" height="96" rx="2" className={cn(styles.surfaceFill, styles.linework)} />
      <path d="M361 404H576M375 420V484M426 420V484M477 420V484M528 420V484" className={styles.fineLine} />
      <path d="M375 420H407V454H375ZM426 420H458V454H426ZM477 420H509V454H477ZM528 420H560V454H528Z" className={styles.tintFill} />
      <path d="M390 454V484M441 454V484M492 454V484M543 454V484" className={styles.accentLine} />
    </g>
    <g className={cn(styles.floor, styles.floorTwo)}>
      <rect x="361" y="308" width="215" height="96" rx="2" className={cn(styles.surfaceFill, styles.linework)} />
      <path d="M361 308H576M375 324V388M426 324V388M477 324V388M528 324V388" className={styles.fineLine} />
      <path d="M375 324H407V358H375ZM426 324H458V358H426ZM477 324H509V358H477ZM528 324H560V358H528Z" className={styles.tintFill} />
      <path d="M390 358V388M441 358V388M492 358V388M543 358V388" className={styles.accentLine} />
    </g>
    <g className={cn(styles.floor, styles.floorThree)}>
      <rect x="361" y="212" width="215" height="96" rx="2" className={cn(styles.surfaceFill, styles.linework)} />
      <path d="M361 212H576M375 228V292M426 228V292M477 228V292M528 228V292" className={styles.fineLine} />
      <path d="M375 228H407V262H375ZM426 228H458V262H426ZM477 228H509V262H477ZM528 228H560V262H528Z" className={styles.tintFill} />
      <path d="M390 262V292M441 262V292M492 262V292M543 262V292" className={styles.accentLine} />
    </g>
    <g className={cn(styles.floor, styles.floorFour)}>
      <path d="M361 212V157L390 133H548L576 157V212Z" className={cn(styles.tintFill, styles.linework)} />
      <path d="M361 157H576M390 157V199M429 157V199M468 157V199M507 157V199M548 157V199M390 199H548" className={styles.accentLine} />
      <path d="M378 147L393 134M557 134L572 147" className={styles.mintLine} />
    </g>

    <g className={styles.fineLine}>
      <path d="M300 212H312M295 308H312M295 404H312M300 500H312M304 212V500" />
      <path d="M298 212L304 202L310 212M298 500L304 510L310 500" />
      <path d="M640 500V456M634 500H646M634 456H646" />
    </g>
    <path d="M640 448L646 456L640 464" className={styles.accentLine} />
    <circle cx="640" cy="431" r="5" className={styles.solidAccent} />
    <path d="M128 514V490M116 514H140M114 514L128 500L142 514" className={styles.linework} />
    <circle cx="128" cy="484" r="6" className={styles.solidMint} />
  </IllustrationCanvas>;
}

