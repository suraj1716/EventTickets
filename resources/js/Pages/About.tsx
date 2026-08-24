import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import React, { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import SectionHeading, {
  Eyebrow,
  Ornament,
  Title,
} from "@/Components/App/ui/SectionHeading";

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const team = [
  {
    name: "Sandesh Rajbhandari",
    role: "Promoter",
    bio: "Bringing a family legacy of hairdressing expertise from Nepal to Sydney, Sandesh helps lead RB Hair & Beauty Lounge with a focus on exceptional guest experience.",
    img: "/images/sandesh.jpg", // replace with real photo
    objectPosition: "center 20%",
    specialty: "Client Experience",
  },
  {
    name: "Mausami Rajbhandari Piya",
    role: "Managing Director",
    bio: "Mausami leads a skilled and passionate team of stylists, bringing polish and expertise to every service at RB Hair & Beauty Lounge.",
    img: "/images/mausami.jpg", // replace with real photo
    objectPosition: "center top",
    specialty: "Hairdressing & Beauty",
  },
];

const values = [
  {
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    title: "Family Heritage",
    body: "A family legacy of hairdressing expertise, brought from Nepal to Sydney and shared with every guest who walks through our doors.",
  },
  {
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    title: "Care & Detail",
    body: "A knowledgeable stylist who listens to what you want and need — service that's full of detail but never misses the main point.",
  },
  {
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M6.343 6.343l-.707-.707M6.343 17.657l-.707.707M15.536 15.536l.707.707M12 21v-1",
    title: "Sustainability",
    body: "Environmentally sustainable practices are built into every aspect of the services we provide.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Giving Back",
    body: "A portion of every service goes toward supporting a charitable cause important to our community.",
  },
];

const milestones = [
  {
    year: "2018",
    event:
      "RB Hair & Beauty Lounge opens its doors in Sydney CBD with a team of three.",
  },
  {
    year: "2020",
    event:
      "Expanded to a full-floor atelier and launched our signature Scalp Ritual.",
  },
  {
    year: "2022",
    event: "Named Best Luxury Salon in NSW at the Australian Hair Awards.",
  },
  {
    year: "2024",
    event: "Launched our online product boutique and gift voucher experience.",
  },
  {
    year: "2026",
    event: "Celebrated 8 years and 500+ transformed clients.",
  },
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const About: React.FC = () => {
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: "ease-out" });
    const el = document.getElementById("about-stats");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (

       <div
      className=" isolate"
      style={{ fontFamily: "var(--font-body)", background: "var(--color-bg)" }}
    >
    <AuthenticatedLayout>
      <div
        style={{
          fontFamily: "var(--font-body)",
          background: "var(--color-bg)",
          overflowX: "hidden",
        }}
      >
        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section
          style={{
            position: "relative",
            paddingTop: "6rem",
            paddingBottom: "6rem",
            minHeight: "72vh",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            background: "var(--color-bg-dark)",
          }}
        >
          {/* bg image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url(https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* overlays */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(28,26,23,0.85) 0%, rgba(28,26,23,0.5) 60%, rgba(28,26,23,0.2) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(28,26,23,0.6) 0%, transparent 50%)",
            }}
          />

          {/* decorative circles */}
          {[500, 350, 220].map((size, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                right: -size / 3,
                top: "50%",
                transform: "translateY(-50%)",
                width: size,
                height: size,
                borderRadius: "50%",
                border: `1px solid rgba(201,169,110,${0.12 - i * 0.03})`,
                pointerEvents: "none",
              }}
            />
          ))}

          <div className="container-site"
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
            }}
          >
            <div style={{ maxWidth: 580 }} data-aos="fade-right">
              <Eyebrow tone="light">Our Story</Eyebrow>
              <Ornament />
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3rem, 6vw, 5rem)",
                  fontWeight: 300,
                  color: "white",
                  lineHeight: 1.08,
                  marginBottom: "1.25rem",
                }}
              >
                A Small Team of{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-accent-light)",
                  }}
                >
                  Creative People
                </em>
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.68)",
                  lineHeight: 1.8,
                  maxWidth: 440,
                  marginBottom: "2.5rem",
                }}
              >
                Australian certified hairdressers and beauticians. RB Hair &
                Beauty Lounge brings a family legacy of craft, care, and
                expertise to Sydney.
              </p>
              {/* trust row */}
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                {["Australian Certified", "Sydney", "Family Owned"].map((b) => (
                  <div
                    key={b}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        background: "var(--color-accent)",
                        transform: "rotate(45deg)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* scroll hint */}
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 1,
                height: 48,
                background:
                  "linear-gradient(to bottom, transparent, rgba(201,169,110,0.6))",
                margin: "0 auto",
              }}
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            INTRO / STORY
        ══════════════════════════════════════════ */}
      <section
  style={{ background: "var(--color-surface)", padding: "6rem 0" }}
  className="!py-16 md:!py-24"
>
  <div className="container-site grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* text */}
            <div  data-aos="fade-right ">
              <Eyebrow>About Us</Eyebrow>
              <Ornament />

              <Title tone="light">
                Welcome to{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-primary)",
                    marginTop: -20,
                  }}
                >
                  RB Hair & Beauty Lounge
                </em>
              </Title>

              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <img
                  src="/images/tafe-logo.png"
                  alt="TAFE Certified"
                  className="h-12 md:h-16 w-auto object-contain"
                />
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Australian Certified Hairdressers and Beauticians
                </span>
              </div>

              <p
                style={{
                  color: "var(--color-text-muted)",
                  lineHeight: 1.85,
                }}
                className="mb-5 mt-6 md:mt-8"
              >
                RB Hair & Beauty Lounge Australia is led by Mausami Rajbhandari
                Piya and her husband Sandesh Rajbhandari, together with a team
                of skilled and passionate stylists. Originally from Nepal, their
                family's hairdressing experience spans across Sydney, Australia.
                The Rajbhandari family come together at RB Hair & Beauty Lounge
                to offer guests exceptional hairdressing delivered with polish
                and expertise.
              </p>
              <p
                style={{
                  color: "var(--color-text-muted)",
                  lineHeight: 1.85,
                }}
                className="mb-8"
              >
                When you visit RB Hair & Beauty Lounge, expect a warm welcome
                into a relaxing space. Expect a knowledgeable stylist who
                listens to what you want and need. Expect a service experience
                that is full of detail but never misses the main point — simply
                beautiful hair and beauty.
              </p>

              <div className="flex gap-8 sm:gap-12 flex-wrap">
                {[
                  ["15+", "Years"],
                  ["2,700+", "Clients"],
                  ["48", "Stylists"],
                ].map(([num, label]) => (
                  <div key={label}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--color-primary)",
                        lineHeight: 1,
                      }}
                      className="text-3xl md:text-[2.25rem] font-normal"
                    >
                      {num}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        letterSpacing: "0.18em",
                        color: "var(--color-text-light)",
                      }}
                      className="text-[0.6rem] md:text-[0.65rem] uppercase mt-1"
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* image */}
            <div
              data-aos="fade-left"
              className="relative mx-auto max-w-md lg:max-w-none w-full"
            >
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"
                alt="RB Hair & Beauty Lounge interior"
                style={{
                  aspectRatio: "4/5",
                  objectFit: "cover",
                  borderRadius: "var(--radius-md)",
                }}
                className="w-full block"
              />

              {/* gold accent frame */}
              <div
                style={{
                  border: "1px solid var(--color-accent-light)",
                  borderRadius: "var(--radius-md)",
                }}
                className="absolute -top-3 -right-3 md:-top-4 md:-right-4 w-1/2 h-1/2 pointer-events-none -z-10"
              />

              {/* floating badge */}
              <div
                style={{
                  background: "var(--color-primary)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                }}
                className="absolute bottom-4 left-2 sm:bottom-6 sm:-left-8 px-5 py-4 md:px-6 md:py-5"
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--color-accent-light)",
                    lineHeight: 1,
                  }}
                  className="text-2xl md:text-[2rem] font-normal"
                >
                  15
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.55)",
                  }}
                  className="text-[0.55rem] md:text-[0.6rem] uppercase mt-1"
                >
                  Years of Excellence
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            VALUES
        ══════════════════════════════════════════ */}
        <section
          style={{
            background: "var(--color-bg-alt)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "6rem 0",
          }}
        >
          <div className="container-site">


            <div data-aos="fade-up">
              <div className="pillars-heading-wrap mb-24">
                <Eyebrow center>What We Stand For</Eyebrow>
                <Title center>
                  Our{" "}
                  <em
                    style={{
                      fontStyle: "italic",
                      color: "var(--color-primary)",
                    }}
                  >
                    Values
                  </em>
                </Title>
                <Ornament center />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {values.map((v, i) => (
                <div
                  key={i}
                  data-aos="fade-up"
                  data-aos-delay={i * 80}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "2.25rem 2rem",
                    position: "relative",
                    overflow: "hidden",
                    transition:
                      "box-shadow var(--transition-base), border-color var(--transition-base)",
                  }}
                  className="group hover:border-[var(--color-accent)] hover:shadow-lg"
                >
                  {/* top accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "var(--color-accent)",
                      transform: "scaleX(0)",
                      transformOrigin: "left",
                      transition: "transform 0.4s ease",
                    }}
                    className="group-hover:scale-x-100"
                  />

                  <div
                    style={{
                      width: 48,
                      height: 48,
                      border: "1px solid var(--color-accent-light)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-accent)"
                      strokeWidth="1.5"
                      style={{ width: 20, height: 20 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={v.icon}
                      />
                    </svg>
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.25rem",
                      fontWeight: 400,
                      color: "var(--color-text)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {v.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--color-text-muted)",
                      lineHeight: 1.75,
                      fontSize: "0.9rem",
                    }}
                  >
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TEAM
        ══════════════════════════════════════════ */}
        <section
          style={{ background: "var(--color-surface)", padding: "6rem 0" }}
        >
          <div className="container-site">
            <div id="team" data-aos="fade-up" className="mb-24">
              <Eyebrow center>The Artisans</Eyebrow>
              <Title center>
                Meet Our{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-primary)",
                  }}
                >
                  Team
                </em>
              </Title>
              <Ornament center />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "2rem",
              }}
            >
              {team.map((member, i) => (
                <div
                  key={i}
                  data-aos="fade-up"
                  data-aos-delay={i * 80}
                  style={{
                    background: "var(--color-surface-warm)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    transition:
                      "box-shadow var(--transition-base), transform var(--transition-base)",
                  }}
                  className="group hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* image */}
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      height: 320,
                    }}
                  >
                    <img
                      src={member.img}
                      alt={member.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition:
                          member.objectPosition ?? "center center",
                        transition: "transform 0.6s ease",
                      }}
                      className="group-hover:scale-105"
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(28,26,23,0.5) 0%, transparent 50%)",
                      }}
                    />
                    {/* specialty badge */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "1rem",
                        left: "1rem",
                        background: "rgba(201,169,110,0.9)",
                        padding: "3px 12px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--color-bg-dark)",
                          fontWeight: 500,
                        }}
                      >
                        {member.specialty}
                      </span>
                    </div>
                  </div>

                  {/* body */}
                  <div style={{ padding: "1.5rem" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.2rem",
                        fontWeight: 400,
                        color: "var(--color-text)",
                        marginBottom: 2,
                      }}
                    >
                      {member.name}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.68rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--color-accent-dark)",
                        marginBottom: "0.875rem",
                      }}
                    >
                      {member.role}
                    </p>
                    <p
                      style={{
                        color: "var(--color-text-muted)",
                        fontSize: "0.875rem",
                        lineHeight: 1.7,
                      }}
                    >
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TIMELINE
        ══════════════════════════════════════════ */}
        <section
          style={{
            background: "var(--color-bg-alt)",
            borderTop: "1px solid var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
            padding: "6rem 0",
          }}
        >
        <div className="container-site">
            <div data-aos="fade-up" className="mb-24">
              <Eyebrow center>Our Journey</Eyebrow>
              <Title center>
                Eight Years of{" "}
                <em
                  style={{
                    fontStyle: "italic",
                    color: "var(--color-primary)",
                  }}
                >
                  Excellence
                </em>
              </Title>
              <Ornament center />
            </div>

            <div
              style={{
                position: "relative",
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              {/* centre line */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "var(--color-border)",
                  transform: "translateX(-50%)",
                }}
                className="hidden md:block"
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2.5rem",
                }}
              >
                {milestones.map((m, i) => (
                  <div
                    key={i}
                    data-aos={i % 2 === 0 ? "fade-right" : "fade-left"}
                    data-aos-delay={i * 60}
                    style={{
                      display: "flex",
                      gap: "2rem",
                      alignItems: "flex-start",
                      justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
                    }}
                    className="md:pr-[calc(50%+2rem)] even:md:pr-0 even:md:pl-[calc(50%+2rem)]"
                  >
                    <div
                      style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.25rem 1.5rem",
                        flex: 1,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.5rem",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "var(--color-primary)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        {m.year}
                      </span>
                      <p
                        style={{
                          color: "var(--color-text-muted)",
                          fontSize: "0.9rem",
                          lineHeight: 1.7,
                        }}
                      >
                        {m.event}
                      </p>
                      {/* dot on line */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: -42,
                          transform: "translateY(-50%)",
                          width: 10,
                          height: 10,
                          background: "var(--color-primary)",
                          borderRadius: "50%",
                          border: "2px solid var(--color-bg-alt)",
                        }}
                        className="hidden md:block"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CTA
        ══════════════════════════════════════════ */}
        <section
          style={{
            background: "var(--color-primary)",
            padding: "6rem 0",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* decorative rings */}
          {[440, 300, 180].map((size, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                right: -size / 3,
                top: "50%",
                transform: "translateY(-50%)",
                width: size,
                height: size,
                borderRadius: "50%",
                border: `1px solid rgba(201,169,110,${0.14 - i * 0.04})`,
                pointerEvents: "none",
              }}
            />
          ))}

          <div className="container-site"
            style={{
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
            data-aos="fade-up"
          >
            <Eyebrow tone="light" center>
              Ready to Experience RB Hair & Beauty Lounge?
            </Eyebrow>
            <Ornament center />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 300,
                color: "white",
                lineHeight: 1.15,
                maxWidth: 600,
                margin: "0 auto 1.25rem",
                marginTop: 20,
              }}
            >
              Your most beautiful hair starts with a{" "}
              <em
                style={{
                  fontStyle: "italic",
                  color: "var(--color-accent-light)",
                }}
              >
                conversation
              </em>
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.62)",
                fontSize: "1rem",
                lineHeight: 1.75,
                maxWidth: 460,
                margin: "0 auto 2.5rem",
              }}
            >
              Book a complimentary consultation and let our team craft a
              personalised plan for your hair goals.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/shop"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 28px",
                  background: "var(--color-accent)",
                  color: "var(--color-bg-dark)",
                  border: "1px solid var(--color-accent)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Book a Consultation
              </a>
              <a
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "13px 28px",
                  background: "transparent",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.4)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  fontWeight: 400,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Get in Touch
              </a>
            </div>
          </div>
        </section>
      </div>
    </AuthenticatedLayout>
    </div>
  );
};

export default About;
