import { ArrowRight, BadgeCheck, Building2, CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/cloud-image";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { CountUp, HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { Card, Container, EmptyState, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { AboutPageData, AboutJourney } from "@/server/queries/about";

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "About", item: "/about" },
] as const;

export function LegacyAboutPage({ data }: { data: AboutPageData }) {
  const { settings, story, mission, team } = data;
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <Container className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-20">
          <div className="space-y-12">
            {story ? (
              <Reveal>
                <section>
                  <SectionHeading eyebrow="Our story" title={story.title} />
                  <MarkdownRenderer
                    content={story.body}
                    className="prose prose-slate mt-6 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep"
                  />
                </section>
              </Reveal>
            ) : null}
            {mission ? (
              <Reveal delay={80}>
                <section>
                  <SectionHeading eyebrow="Our mission" title={mission.title} />
                  <MarkdownRenderer
                    content={mission.body}
                    className="prose prose-slate mt-6 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-brand-deep"
                  />
                </section>
              </Reveal>
            ) : null}
            {!story && !mission ? (
              <EmptyState
                title="About information is being prepared"
                description="The company story and mission will appear here once they are published."
              />
            ) : null}
          </div>
          <aside className="space-y-5">
            <HoverCard>
              <Card className="bg-surface-alt">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">
                  At a glance
                </p>
                <dl className="mt-6 divide-y divide-line">
                  <div className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm text-ink-muted">Established</dt>
                    <dd className="font-heading text-xl font-semibold">
                      {settings.foundedYear}
                    </dd>
                  </div>
                  {team.length > 0 ? (
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-sm text-ink-muted">
                        Public team profiles
                      </dt>
                      <dd className="font-heading text-xl font-semibold">
                        {team.length}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-control bg-brand px-4 text-sm font-bold text-brand-ink hover:bg-brand/90"
                >
                  Talk to the team <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Card>
            </HoverCard>
            {settings.credentials.length > 0 ? (
              <HoverCard>
                <Card>
                  <h2 className="font-heading text-xl font-semibold">
                    Credentials
                  </h2>
                  <RevealGroup className="mt-5 space-y-4">
                    {settings.credentials.map((credential) => (
                      <Reveal key={`${credential.label}-${credential.value}`}>
                        <div className="flex gap-3">
                          <BadgeCheck
                            className="mt-0.5 shrink-0 text-brand-deep"
                            size={18}
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="block text-sm">
                              {credential.label}
                            </strong>
                            <span className="mt-1 block text-sm leading-6 text-ink-muted">
                              {credential.value}
                            </span>
                          </span>
                        </div>
                      </Reveal>
                    ))}
                  </RevealGroup>
                </Card>
              </HoverCard>
            ) : null}
          </aside>
        </div>

        <section className="mt-20" aria-labelledby="team-heading">
          <SectionHeading
            eyebrow="The people behind the work"
            title="Project leadership and support"
          />
          {team.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="Team profiles are being prepared"
                description="Published team information will appear here once it is available."
              />
            </div>
          ) : (
            <RevealGroup
              id="team-heading"
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {team.map((member) => (
                <Reveal key={member.id}>
                  <HoverCard className="h-full">
                    <Card className="h-full p-4">
                      <MaskImage className="rounded-card">
                        <div className="relative aspect-square overflow-hidden rounded-card bg-surface-alt">
                          {member.photo ? (
                            <CloudImage
                              src={member.photo.url}
                              alt={member.photo.alt}
                              fill
                              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                              data-hover-image
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-full items-center justify-center text-4xl font-heading font-bold text-brand/50"
                              aria-hidden="true"
                            >
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </MaskImage>
                      <h3 className="mt-4 font-heading text-lg font-semibold">
                        {member.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-brand-deep">
                        {member.designation}
                      </p>
                      {member.qualification ? (
                        <p className="mt-1 text-sm text-ink-muted">
                          {member.qualification}
                        </p>
                      ) : null}
                      {member.experienceYrs !== null ? (
                        <p className="mt-3 text-sm text-ink-muted">
                          {member.experienceYrs} years of experience
                        </p>
                      ) : null}
                      {member.bio ? (
                        <MarkdownRenderer
                          content={member.bio}
                          className="prose prose-sm mt-3 max-w-none leading-6 text-ink-muted"
                        />
                      ) : null}
                    </Card>
                  </HoverCard>
                </Reveal>
              ))}
            </RevealGroup>
          )}
        </section>

        <section
          className="mt-20 rounded-panel bg-brand/10 p-8 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10"
          aria-labelledby="about-cta-heading"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-deep">
              Start a conversation
            </p>
            <h2
              id="about-cta-heading"
              className="mt-2 max-w-2xl font-heading text-3xl font-semibold"
            >
              Discuss your construction, repair or rehabilitation requirement.
            </h2>
          </div>
          <Link
            href="/estimate"
            className="mt-6 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-control bg-brand px-6 font-bold text-brand-ink hover:bg-brand/90 lg:mt-0"
          >
            Get Free Quote <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </Container>
    </>
  );
}

const aboutValues = [
  { title: "Genuine engineering solutions", description: "Civil engineering services and solutions for corporate offices and co-operative housing societies." },
  { title: "Repair-led expertise", description: "Repairs and rehabilitation of RCC structures, including structural strengthening." },
  { title: "Working in tandem", description: "Working in tandem with consultants and clients while executing jobs of varying magnitude." },
] as const;

function AboutCredentialCards({ credentials }: { credentials: AboutPageData["settings"]["credentials"] }) {
  const approved = credentials.filter((credential) => `${credential.label} ${credential.value}`.toLowerCase().includes("msme") || `${credential.label} ${credential.value}`.toLowerCase().includes("insur"));
  if (approved.length === 0) return null;
  return <section className="section-light"><Container className="section-space-generous"><SectionHeading eyebrow="Credentials" title="Registered and responsibly covered" description="Credentials shown here come from the public site settings." /><RevealGroup className="mt-10 grid gap-5 md:grid-cols-2">{approved.map((credential) => { const isMsme = `${credential.label} ${credential.value}`.toLowerCase().includes("msme"); const Icon = isMsme ? Building2 : ShieldCheck; return <Reveal key={`${credential.label}-${credential.value}`}><Card className="h-full border-line bg-tint"><div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-ink"><Icon size={22} aria-hidden="true" /></div><h3 className="mt-5 font-heading text-xl font-semibold">{credential.label}</h3><p className="mt-3 text-sm leading-7 text-ink-muted">{credential.value}</p></Card></Reveal>; })}</RevealGroup></Container></section>;
}

function AboutJourneyTimeline({ foundedYear, journey }: { foundedYear: number; journey: AboutJourney | null }) {
  if (!foundedYear && !journey?.milestones.length) return null;
  const events = [{ year: foundedYear, title: "Established", description: "M/s. Vakratund Construction was established." }, ...(journey?.milestones ?? [])];
  return <section className="section-tint"><Container className="section-space-generous"><SectionHeading eyebrow={journey?.eyebrow || "Timeline"} title={journey?.title || "Our journey"} /><RevealGroup className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{events.map((event, index) => <Reveal key={`${event.year}-${event.title}-${index}`}><article className="relative h-full rounded-card border border-line bg-bg p-5 shadow-soft"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink"><CheckCircle2 size={18} aria-hidden="true" /></span><p className="font-heading text-xl font-bold tabular-nums text-accent-ink"><CountUp value={event.year} format="year" /></p></div><h3 className="mt-5 font-heading text-lg font-semibold">{event.title}</h3>{event.description ? <p className="mt-2 text-sm leading-6 text-ink-muted">{event.description}</p> : null}</article></Reveal>)}</RevealGroup></Container></section>;
}

export function AboutPage({ data }: { data: AboutPageData }) {
  const { settings, story, mission, journey, aboutImage, serviceCount, team } = data;
  const facts = [
    { label: "Established", value: settings.foundedYear, format: "year" as const, Icon: Building2 },
    { label: "Team members", value: team.length, format: "number" as const, Icon: UsersRound },
    { label: "Service lines", value: serviceCount, format: "number" as const, Icon: CheckCircle2 },
  ];

  return <>
    <BreadcrumbJsonLd items={breadcrumbs} />
    <section className="section-light"><Container className="section-space-generous"><div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)] lg:items-start lg:gap-16"><Reveal><div>{story ? <><p className="eyebrow">Our story</p><h2 className="mt-3 font-heading text-h2 font-semibold">{story.title}</h2><MarkdownRenderer content={story.body} className="prose prose-slate mt-6 max-w-none leading-8 text-ink-muted prose-headings:font-heading prose-headings:text-ink prose-a:text-accent-ink" /></> : <EmptyState title="Our story is being prepared" description="Published company information will appear here once it is available." />}</div></Reveal><Reveal delay={80}><div className="relative"><div className="relative aspect-[4/3] overflow-hidden rounded-feature border border-line bg-tint shadow-soft">{aboutImage ? <CloudImage src={aboutImage.url} alt={aboutImage.title} fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" /> : <div className="home-blueprint-pattern size-full bg-gradient-to-br from-tint via-bg to-accent/20" aria-hidden="true" />}</div><div className="absolute -bottom-6 left-5 rounded-card border border-line bg-dark p-5 text-white shadow-raised sm:left-8"><p className="eyebrow text-accent-2">Since</p><p className="mt-1 font-heading text-4xl font-bold tabular-nums"><CountUp value={settings.foundedYear} format="year" /></p></div></div></Reveal></div><RevealGroup className="mt-16 grid gap-4 md:grid-cols-3">{facts.map(({ label, value, format, Icon }) => <Reveal key={label}><Card className="border-line bg-tint"><Icon className="text-accent-ink" size={22} aria-hidden="true" /><p className="mt-5 font-heading text-3xl font-bold tabular-nums text-accent-ink"><CountUp value={value} format={format} /></p><p className="mt-1 text-sm text-ink-muted">{label}</p></Card></Reveal>)}</RevealGroup></Container></section>

    {mission ? <section className="section-tint"><Container className="section-space-generous"><SectionHeading eyebrow="Our aim and values" title={mission.title} description={mission.body} /><RevealGroup className="mt-10 grid gap-5 md:grid-cols-3">{aboutValues.map((value) => <Reveal key={value.title}><HoverCard className="h-full rounded-card"><Card className="h-full border-line bg-bg"><div className="flex size-11 items-center justify-center rounded-full bg-accent/15 text-accent-ink"><CheckCircle2 size={20} aria-hidden="true" /></div><h3 className="mt-5 font-heading text-xl font-semibold">{value.title}</h3><p className="mt-3 text-sm leading-7 text-ink-muted">{value.description}</p></Card></HoverCard></Reveal>)}</RevealGroup></Container></section> : null}

    <AboutCredentialCards credentials={settings.credentials} />

    <section className="section-tint"><Container className="section-space-generous"><SectionHeading eyebrow="The people behind the work" title="Project leadership and support" />{team.length === 0 ? <div className="mt-8"><EmptyState title="Team profiles are being prepared" description="Published team information will appear here once it is available." /></div> : <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{team.map((member) => <Reveal key={member.id}><HoverCard className="group h-full rounded-card"><Card className="h-full border-line bg-bg p-4"><div className="relative aspect-[4/5] overflow-hidden rounded-card bg-cta-gradient">{member.photo ? <CloudImage src={member.photo.url} alt={member.photo.alt} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" data-hover-image className="object-cover" /> : <div className="flex h-full items-center justify-center font-heading text-5xl font-bold text-dark/80" aria-hidden="true">{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</div>}</div><h3 className="mt-4 font-heading text-lg font-semibold">{member.name}</h3><p className="mt-1 text-sm font-medium text-accent-ink">{member.designation}</p>{member.qualification ? <p className="mt-1 text-sm text-ink-muted">{member.qualification}</p> : null}{member.experienceYrs !== null ? <p className="mt-3 text-sm text-ink-muted">{member.experienceYrs} years of experience</p> : null}{member.bio ? <div className="mt-3 min-h-20 translate-y-1 overflow-hidden text-sm leading-6 text-ink-muted opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"><MarkdownRenderer content={member.bio} className="prose prose-sm max-w-none" /></div> : null}</Card></HoverCard></Reveal>)}</RevealGroup>}</Container></section>

    <AboutJourneyTimeline foundedYear={settings.foundedYear} journey={journey} />

    <section className="section-gradient relative"><Container className="relative z-10 section-space"><Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center"><p className="eyebrow">Start a conversation</p><h2 className="mt-3 font-heading text-h2 font-semibold text-dark">Discuss your construction, repair or rehabilitation requirement.</h2><Link href="/estimate" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-6 font-bold text-accent-ink shadow-soft transition-transform hover:-translate-y-0.5">Get Free Quote <ArrowRight size={18} aria-hidden="true" /></Link></Reveal></Container></section>
  </>;
}
