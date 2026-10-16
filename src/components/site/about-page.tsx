import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

import { CloudImage } from "@/components/cloud-image";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { HoverCard, MaskImage, Reveal, RevealGroup } from "@/components/motion";
import { Card, Container, EmptyState, SectionHeading } from "@/components/ui";
import { MarkdownRenderer } from "@/lib/markdown/renderer";
import type { AboutPageData } from "@/server/queries/about";
import { PageHero } from "./page-hero";

const breadcrumbs = [
  { name: "Home", item: "/" },
  { name: "About", item: "/about" },
] as const;

export function AboutPage({ data }: { data: AboutPageData }) {
  const { settings, story, mission, team } = data;
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      <PageHero
        breadcrumbs={breadcrumbs.map((item) => ({
          label: item.name,
          href: item.item,
        }))}
        eyebrow="About us"
        title="Civil engineering experience grounded in the region"
        description={settings.tagline}
      />

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
