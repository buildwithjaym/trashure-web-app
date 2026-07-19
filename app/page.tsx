
"use client"
import {
  Menu,
  X,
  ArrowRight,
  BarChart3,
  Brain,
  Camera,
  Coins,
  Handshake,
  Leaf,
  Recycle,
  ScanLine,
  Sparkles,
  Upload,

} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DownloadApkPrompt } from "@/components/download-apk-prompt";
export default function Home() {

  const [mobileOpen, setMobileOpen] = useState(false);

  const problems = [
    {
      title: "Lost Recognition",
      description:
        "People throw away materials because they cannot identify their hidden potential.",
    },
    {
      title: "Lost Opportunities",
      description:
        "Reusable resources disappear before reaching people and organizations that need them.",
    },
    {
      title: "Lost Data",
      description:
        "Communities lack accurate information to create smarter waste solutions.",
    },
  ];


  const solutions = [
    {
      title: "AI Recognition",
      description:
        "Identify materials instantly and understand their recovery potential.",
      icon: Brain,
    },
    {
      title: "Circular Recommendations",
      description:
        "Discover whether materials should be reused, sold, donated, or recycled.",
      icon: Recycle,
    },
    {
      title: "Impact Measurement",
      description:
        "Transform community actions into meaningful sustainability insights.",
      icon: BarChart3,
    },
  ];


  const processSteps = [
    {
      number: "01",
      label: "Capture",
      title: "Scan the Item",
      description:
        "Take a photo or upload an image of the material you want to recover.",
      detail: "Fast visual input",
      icon: Camera,
      numberStyle:
        "from-emerald-950 via-emerald-700 to-emerald-400 shadow-emerald-950/20",
      iconStyle: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      accentStyle: "from-emerald-500 to-teal-400",
    },
    {
      number: "02",
      label: "Analyze",
      title: "Identify the Material",
      description:
        "Trashure AI detects the item, material type, condition, and recovery potential.",
      detail: "AI material profile",
      icon: Brain,
      numberStyle:
        "from-slate-950 via-teal-900 to-teal-500 shadow-teal-950/20",
      iconStyle: "bg-teal-50 text-teal-700 ring-teal-100",
      accentStyle: "from-teal-500 to-cyan-400",
    },
    {
      number: "03",
      label: "Decide",
      title: "Choose the Best Value Path",
      description:
        "Receive practical options to reuse, sell, donate, or recycle the material.",
      detail: "Clear next actions",
      icon: Coins,
      numberStyle:
        "from-amber-800 via-amber-500 to-yellow-300 shadow-amber-900/20",
      iconStyle: "bg-amber-50 text-amber-700 ring-amber-100",
      accentStyle: "from-amber-500 to-yellow-300",
    },
    {
      number: "04",
      label: "Recover",
      title: "Return It to Circulation",
      description:
        "Connect the material to people, partners, or programs that can use it again.",
      detail: "Less waste, more value",
      icon: Recycle,
      numberStyle:
        "from-green-950 via-green-700 to-lime-500 shadow-green-950/20",
      iconStyle: "bg-lime-50 text-green-700 ring-lime-100",
      accentStyle: "from-green-600 to-lime-400",
    },
  ];


  return (

    <main className="min-h-screen overflow-hidden bg-white text-zinc-900">


      {/* Navbar */}

      <nav
        className="
        fixed
        top-0
        z-50
        w-full
        bg-white/70
        backdrop-blur-xl
        "
      >

        <div
          className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-5
          py-5
          sm:px-8
          "
        >

          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-green-50 shadow-sm">
              <img
                src="/logo.png"
                alt="Trashure Logo"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Text */}
            <div className="flex flex-col">
              <h1 className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-700 bg-clip-text text-2xl font-black tracking-tight text-transparent">
                TRASHURE
              </h1>

              <p className="text-sm text-zinc-500">
                Turn Trash into Treasure
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            <a
              href="#features"
              className="transition hover:text-green-600"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-green-600"
            >
              How It Works
            </a>

            <a
              href="#benefits"
              className="transition hover:text-green-600"
            >
              Why Trashure
            </a>

            <a
              href="#dashboard"
              className="transition hover:text-green-600"
            >
              Dashboard
            </a>

            <Link
              href="/about-the-developer"
              className="transition hover:text-green-600"
            >
              About Developer
            </Link>
          </div>

          <div className="flex items-center gap-3">

            <Link href="/login">

              <Button
                className="
hidden
rounded-full
bg-gradient-to-r
from-green-500
to-emerald-700
px-8
py-6
text-white
shadow-xl
shadow-green-500/40
transition
hover:-translate-y-1
hover:shadow-green-500/60
sm:flex
"
              >

                Start Your Journey

                <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

            </Link>


            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-xl p-2 text-green-700 md:hidden"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>

          </div>

          {mobileOpen && (
            <div className="absolute left-0 top-full w-full border-t border-green-100 bg-white/95 p-6 shadow-2xl backdrop-blur-xl md:hidden">
              <div className="flex flex-col gap-2 text-zinc-700">
                <Link
                  href="#features"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium transition hover:bg-green-50 hover:text-green-600"
                >
                  Features
                </Link>

                <Link
                  href="#how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium transition hover:bg-green-50 hover:text-green-600"
                >
                  How It Works
                </Link>

                <Link
                  href="#benefits"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium transition hover:bg-green-50 hover:text-green-600"
                >
                  Why Trashure
                </Link>

                <Link
                  href="#dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium transition hover:bg-green-50 hover:text-green-600"
                >
                  Dashboard
                </Link>

                <Link
                  href="/about-the-developer"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium transition hover:bg-green-50 hover:text-green-600"
                >
                  About Developer
                </Link>

                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3"
                >
                  <Button className="w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 py-6 text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}


        </div>

      </nav>




      {/* Hero Section */}


      <section
        id="home"
        className="
        relative
        overflow-hidden
        bg-gradient-to-br
        from-white
        via-green-50
        to-white
        pb-28
        pt-40
        "
      >


        <div
          className="
          absolute
          left-0
          top-20
          h-96
          w-96
          rounded-full
          bg-green-300/30
          blur-3xl
          "
        />


        <div
          className="
          absolute
          bottom-0
          right-0
          h-80
          w-80
          rounded-full
          bg-emerald-300/20
          blur-3xl
          "
        />


        <div
          className="
          mx-auto
          grid
          max-w-7xl
          gap-14
          px-5
          sm:px-8
          lg:grid-cols-2
          lg:items-center
          "
        >


          <div>


            <Badge
              className="
              rounded-full
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >

              <Sparkles className="mr-2 h-4 w-4" />

              AI-Powered Circular Economy Platform

            </Badge>



            <h1
              className="
              mt-8
              text-5xl
              font-bold
              leading-tight
              tracking-tight
              sm:text-6xl
              lg:text-7xl
              "
            >

              What if waste

              <br />

              was just a missed

              <span
                className="
                block
                bg-gradient-to-r
                from-green-500
                via-emerald-500
                to-green-700
                bg-clip-text
                text-transparent
                "
              >
                opportunity?
              </span>

            </h1>



            <p
              className="
              mt-7
              max-w-xl
              text-lg
              leading-relaxed
              text-zinc-600
              "
            >

              Every day, valuable materials are thrown away because
              we do not know what they can become.

              Trashure uses artificial intelligence to recognize materials
              before they become waste and connects them to their next purpose.

            </p>



            <div
              className="
              mt-10
              flex
              flex-col
              gap-4
              sm:flex-row
              "
            >


              <Link href="/login">
                <Button className="group w-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 px-7 py-5 text-sm font-semibold text-white shadow-xl shadow-green-500/30 transition duration-300 hover:-translate-y-1 hover:shadow-green-500/50 sm:w-auto sm:px-10 sm:py-6 sm:text-base">
                  <ScanLine className="mr-2 h-4 w-4 transition group-hover:scale-110" />
                  Start Scanning Materials
                </Button>
              </Link>



              <Link href="/how-it-works">
                <Button className="group w-full rounded-full border border-green-200 bg-white px-7 py-5 text-sm font-semibold text-green-700 transition duration-300 hover:-translate-y-1 hover:border-green-300 hover:bg-green-50 sm:w-auto sm:px-10 sm:py-6 sm:text-base">
                  How It Works
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                </Button>
              </Link>

            </div>



          </div>





          {/* AI Preview Card */}


          <Card
            className="
            animate-[float_6s_ease-in-out_infinite]
            rounded-[32px]
            border-none
            bg-white/80
            p-6
            shadow-2xl
            shadow-green-900/10
            backdrop-blur-xl
            sm:p-10
            "
          >

            <div
              className="
              rounded-[28px]
              bg-gradient-to-br
              from-green-100
              to-white
              p-8
              "
            >


              <div
                className="
                flex
                justify-center
                "
              >

                <div
                  className="
                  rounded-3xl
                  bg-white
                  p-8
                  shadow-xl
                  shadow-green-900/10
                  "
                >

                  <Camera
                    className="
                    h-16
                    w-16
                    text-green-600
                    "
                  />

                </div>


              </div>



              <h2
                className="
                mt-8
                text-center
                text-2xl
                font-bold
                "
              >

                Trashure AI Scanner

              </h2>



              <p
                className="
                mt-3
                text-center
                text-zinc-600
                "
              >

                One scan reveals what your material can become.

              </p>



              <div
                className="
                mt-8
                rounded-3xl
                bg-white
                p-6
                shadow-sm
                "
              >

                <p className="text-sm text-zinc-500">
                  AI Detection Result
                </p>


                <h3 className="mt-3 text-xl font-bold">
                  PET Plastic Bottle
                </h3>


                <Badge
                  className="
                  mt-3
                  bg-green-100
                  text-green-700
                  "
                >
                  96% Confidence
                </Badge>



                <div
                  className="
                  mt-6
                  grid
                  grid-cols-3
                  gap-3
                  "
                >

                  <div className="rounded-2xl bg-green-50 p-3 text-center text-sm">
                    ♻
                    <br />
                    Recycle
                  </div>

                  <div className="rounded-2xl bg-green-50 p-3 text-center text-sm">
                    🌱
                    <br />
                    Reuse
                  </div>

                  <div className="rounded-2xl bg-green-50 p-3 text-center text-sm">
                    💰
                    <br />
                    Sell
                  </div>


                </div>


              </div>


            </div>


          </Card>


        </div>


      </section>

      {/* Problem Section */}

      <section id="problem" className="py-28">

        <div className="mx-auto max-w-7xl px-5 sm:px-8">


          <div className="mx-auto max-w-3xl text-center">

            <Badge
              className="
              rounded-full
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >
              The Challenge
            </Badge>


            <h2
              className="
              mt-6
              text-4xl
              font-bold
              tracking-tight
              sm:text-5xl
              "
            >

              Waste does not begin
              <br />
              in the landfill.

            </h2>


            <p
              className="
              mt-5
              text-lg
              leading-relaxed
              text-zinc-600
              "
            >

              It begins when valuable materials lose their purpose.

              A bottle, a box, or a can does not become useless because
              it has no value. It becomes waste because the information
              needed to recover its value is missing.

            </p>


          </div>



          <div
            className="
            mt-14
            grid
            gap-6
            md:grid-cols-3
            "
          >

            {problems.map((problem) => (

              <Card
                key={problem.title}
                className="
                rounded-[28px]
                border-none
                bg-gradient-to-br
                from-white
                to-green-50
                p-8
                shadow-lg
                shadow-green-900/5
                "
              >

                <div
                  className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-green-100
                  text-green-700
                  "
                >
                  <Sparkles className="h-6 w-6" />
                </div>


                <h3
                  className="
                  mt-6
                  text-xl
                  font-bold
                  "
                >

                  {problem.title}

                </h3>


                <p
                  className="
                  mt-3
                  leading-relaxed
                  text-zinc-600
                  "
                >

                  {problem.description}

                </p>


              </Card>

            ))}


          </div>


        </div>


      </section>





      {/* Solution Section */}


      <section
        id="solution"
        className="
        bg-gradient-to-br
        from-green-50
        via-white
        to-green-50
        py-28
        "
      >

        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-8
          "
        >


          <div
            className="
            mx-auto
            max-w-3xl
            text-center
            "
          >

            <Badge
              className="
              rounded-full
              bg-green-600
              px-4
              py-2
              text-white
              "
            >
              The Trashure Solution
            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              Giving every material
              <br />
              another possibility.

            </h2>


            <p
              className="
              mt-5
              text-lg
              text-zinc-600
              "
            >

              Trashure transforms waste management from a disposal system
              into a circular economy ecosystem.

            </p>


          </div>




          <div
            className="
            mt-14
            grid
            gap-6
            md:grid-cols-3
            "
          >


            {solutions.map((solution) => (

              <Card
                key={solution.title}
                className="
                rounded-[32px]
                border-none
                bg-white
                p-8
                shadow-xl
                shadow-green-900/5
                "
              >


                <div
                  className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-green-100
                  "
                >

                  <solution.icon
                    className="
                    h-7
                    w-7
                    text-green-600
                    "
                  />

                </div>



                <h3
                  className="
                  mt-7
                  text-xl
                  font-bold
                  "
                >

                  {solution.title}

                </h3>


                <p
                  className="
                  mt-3
                  leading-relaxed
                  text-zinc-600
                  "
                >

                  {solution.description}

                </p>



              </Card>


            ))}



          </div>



        </div>


      </section>

      {/* Features Section */}

      <section
        id="features"
        className="
  py-28
  bg-white
  "
      >

        <div
          className="
    mx-auto
    max-w-7xl
    px-5
    sm:px-8
    "
        >

          {/* Header */}

          <div className="mx-auto max-w-3xl text-center">

            <Badge
              className="
        rounded-full
        bg-green-100
        px-4
        py-2
        text-green-700
        "
            >
              Powerful Features
            </Badge>


            <h2
              className="
        mt-6
        text-4xl
        font-bold
        tracking-tight
        sm:text-5xl
        "
            >

              Turning everyday waste

              <br />

              into intelligent decisions.

            </h2>


            <p
              className="
        mt-5
        text-lg
        leading-relaxed
        text-zinc-600
        "
            >

              Trashure combines artificial intelligence and circular economy
              intelligence to help people discover the hidden value of materials
              before they become waste.

            </p>

          </div>



          {/* Feature Cards */}


          <div
            className="
      mt-14
      grid
      gap-6
      md:grid-cols-2
      lg:grid-cols-4
      "
          >


            {[
              {
                title: "AI Material Scanner",
                description:
                  "Identify materials instantly through AI-powered recognition and understand their recovery potential.",
                value:
                  "Know what you have.",
                icon: Brain,
              },


              {
                title: "Smart Recovery Paths",
                description:
                  "Receive recommendations whether materials should be reused, sold, donated, or recycled.",
                value:
                  "Know what to do next.",
                icon: Recycle,
              },


              {
                title: "Material Value Discovery",
                description:
                  "Reveal the economic and environmental value hidden inside discarded materials.",
                value:
                  "Waste becomes opportunity.",
                icon: Coins,
              },


              {
                title: "Impact Intelligence",
                description:
                  "Transform community actions into sustainability insights through meaningful data.",
                value:
                  "Measure real impact.",
                icon: BarChart3,
              },


            ].map((feature) => (

              <Card
                key={feature.title}
                className="
          group
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-green-100
          bg-white
          p-8
          shadow-lg
          shadow-green-900/5
          transition
          duration-300
          hover:-translate-y-2
          hover:border-green-200
          hover:shadow-xl
          "
              >


                {/* Background Glow */}

                <div
                  className="
            absolute
            -right-10
            -top-10
            h-32
            w-32
            rounded-full
            bg-green-100
            opacity-60
            blur-3xl
            transition
            group-hover:bg-emerald-200
            "
                />



                <div
                  className="
            relative
            "
                >


                  {/* Icon */}

                  <div
                    className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-gradient-to-br
              from-green-100
              to-emerald-50
              "
                  >

                    <feature.icon
                      className="
                h-7
                w-7
                text-green-600
                "
                    />

                  </div>



                  <h3
                    className="
              mt-7
              text-xl
              font-bold
              "
                  >

                    {feature.title}

                  </h3>



                  <p
                    className="
              mt-4
              leading-relaxed
              text-zinc-600
              "
                  >

                    {feature.description}

                  </p>



                  {/* Bottom Value */}

                  <div
                    className="
              mt-6
              rounded-2xl
              bg-green-50
              px-4
              py-3
              text-sm
              font-semibold
              text-green-700
              "
                  >

                    {feature.value}

                  </div>


                </div>


              </Card>

            ))}


          </div>


        </div>

      </section>




      {/* Benefits Section */}



      <section id="benefits" className="py-28">


        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-8
          "
        >


          <div className="text-center">


            <Badge
              className="
              rounded-full
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >
              Why Trashure
            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              More than recycling.

              <br />

              A smarter way to manage resources.

            </h2>


          </div>




          <div
            className="
            mt-14
            grid
            gap-6
            md:grid-cols-2
            lg:grid-cols-4
            "
          >



            {[

              {
                title: "Residents",
                text: "Know before you throw. Discover the value of everyday materials.",
                icon: Leaf
              },

              {
                title: "Schools",
                text: "Turn reusable materials into innovation and learning projects.",
                icon: Sparkles
              },

              {
                title: "Recyclers",
                text: "Connect cleaner materials with recovery opportunities.",
                icon: Coins
              },

              {
                title: "LGUs",
                text: "Use real insights to build smarter sustainability programs.",
                icon: BarChart3
              }


            ].map((item) => (


              <Card
                key={item.title}
                className="
                rounded-[30px]
                border-none
                bg-white
                p-8
                shadow-lg
                shadow-green-900/5
                "
              >


                <item.icon
                  className="
                  h-10
                  w-10
                  text-green-600
                  "
                />


                <h3
                  className="
                  mt-6
                  text-xl
                  font-bold
                  "
                >

                  {item.title}

                </h3>


                <p
                  className="
                  mt-3
                  text-zinc-600
                  "
                >

                  {item.text}

                </p>


              </Card>



            ))}



          </div>



        </div>


      </section>







      {/* How Trashure Works */}

      <section
        id="how-it-works"
        className="relative overflow-hidden bg-zinc-950 py-28 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.10),transparent_28%)]" />
        <div className="absolute left-1/2 top-0 h-px w-[82%] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-300 shadow-sm shadow-emerald-950/40">
              <Sparkles className="mr-2 h-4 w-4" />
              How Trashure Works
            </Badge>

            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Four clear steps from discarded item
              <span className="block bg-gradient-to-r from-emerald-300 via-lime-200 to-amber-200 bg-clip-text text-transparent">
                to recovered value.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
              Trashure identifies what an item is, reveals what value remains,
              and recommends the most useful circular action so fewer materials
              are treated as waste.
            </p>
          </div>

          <div className="relative mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((item, index) => (
              <div key={item.number} className="relative">
                <Card className="group relative h-full overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06] p-7 text-white shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.09]">
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accentStyle}`}
                  />
                  <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/[0.05] blur-2xl transition duration-300 group-hover:bg-white/[0.09]" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div
                      className={`flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${item.numberStyle} text-white shadow-xl ring-1 ring-white/20`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">
                        Step
                      </span>
                      <span className="mt-0.5 text-3xl font-black leading-none tracking-tight">
                        {item.number}
                      </span>
                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${item.iconStyle}`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                  </div>

                  <p className="relative mt-7 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                    {item.label}
                  </p>

                  <h3 className="relative mt-3 text-2xl font-bold leading-tight">
                    {item.title}
                  </h3>

                  <p className="relative mt-4 leading-relaxed text-zinc-300">
                    {item.description}
                  </p>

                  <div className="relative mt-7 flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-medium text-zinc-200">
                    <span
                      className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${item.accentStyle}`}
                    />
                    {item.detail}
                  </div>
                </Card>

                {index < processSteps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-300/20 bg-zinc-900 text-emerald-300 shadow-lg xl:flex">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.07] px-6 py-5 text-center sm:flex-row sm:text-left">
            <Recycle className="h-6 w-6 shrink-0 text-emerald-300" />
            <p className="text-sm leading-relaxed text-zinc-300">
              Each completed action keeps useful materials moving through the
              economy instead of ending their journey in a landfill.
            </p>
          </div>
        </div>
      </section>


      {/* Circular Economy Actions */}



      <section className="py-28">


        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-8
          "
        >


          <div className="text-center">


            <Badge
              className="
              rounded-full
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >
              Circular Economy
            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              One material.

              <br />

              Multiple possibilities.

            </h2>


          </div>




          <div
            className="
            mt-14
            grid
            gap-6
            sm:grid-cols-2
            lg:grid-cols-4
            "
          >



            {[
              {
                title: "Reuse",
                text: "Extend the life of materials through creativity and innovation.",
                icon: Leaf
              },

              {
                title: "Sell",
                text: "Recover economic value from recyclable resources.",
                icon: Coins
              },

              {
                title: "Donate",
                text: "Connect useful materials with communities.",
                icon: Handshake
              },

              {
                title: "Recycle",
                text: "Return materials back into the production cycle.",
                icon: Recycle
              }

            ].map((item) => (


              <Card
                key={item.title}
                className="
                rounded-[32px]
                border-none
                bg-gradient-to-br
                from-white
                to-green-50
                p-8
                text-center
                "
              >

                <item.icon
                  className="
                  mx-auto
                  h-12
                  w-12
                  text-green-600
                  "
                />


                <h3
                  className="
                  mt-6
                  text-xl
                  font-bold
                  "
                >

                  {item.title}

                </h3>


                <p
                  className="
                  mt-3
                  text-sm
                  text-zinc-600
                  "
                >

                  {item.text}

                </p>


              </Card>


            ))}


          </div>


        </div>


      </section>

      {/* AI Scanner Showcase */}


      <section
        className="
        bg-gradient-to-br
        from-green-50
        via-white
        to-green-50
        py-28
        "
      >

        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-8
          "
        >


          <div
            className="
            grid
            gap-14
            lg:grid-cols-2
            lg:items-center
            "
          >


            <div>


              <Badge
                className="
                rounded-full
                bg-green-100
                px-4
                py-2
                text-green-700
                "
              >

                <Sparkles className="mr-2 h-4 w-4" />

                Trashure AI

              </Badge>



              <h2
                className="
                mt-6
                text-4xl
                font-bold
                sm:text-5xl
                "
              >

                Your intelligent

                <br />

                material assistant.

              </h2>



              <p
                className="
                mt-6
                text-lg
                leading-relaxed
                text-zinc-600
                "
              >

                Trashure does more than recognize objects.

                It understands what materials are made of,
                what value they still hold, and what action
                creates the best circular outcome.

              </p>



              <div
                className="
                mt-8
                space-y-4
                "
              >


                {[
                  "Identify unknown materials",
                  "Discover recovery opportunities",
                  "Receive circular recommendations",
                  "Measure environmental impact",
                ].map((item) => (

                  <div
                    key={item}
                    className="
                    flex
                    items-center
                    gap-3
                    "
                  >

                    <div
                      className="
                      flex
                      h-7
                      w-7
                      items-center
                      justify-center
                      rounded-full
                      bg-green-100
                      "
                    >

                      <Sparkles
                        className="
                        h-4
                        w-4
                        text-green-600
                        "
                      />

                    </div>


                    <p className="text-zinc-700">
                      {item}
                    </p>


                  </div>


                ))}


              </div>



            </div>





            <Card
              className="
              rounded-[36px]
              border-none
              bg-white
              p-8
              shadow-2xl
              shadow-green-900/10
              "
            >


              <div
                className="
                rounded-[30px]
                bg-gradient-to-br
                from-green-100
                to-white
                p-8
                "
              >


                <div
                  className="
                  flex
                  items-center
                  justify-center
                  rounded-3xl
                  bg-white
                  p-10
                  shadow-lg
                  "
                >

                  <Camera
                    className="
                    h-20
                    w-20
                    text-green-600
                    "
                  />

                </div>



                <div
                  className="
                  mt-8
                  rounded-3xl
                  bg-white
                  p-6
                  "
                >

                  <p
                    className="
                    text-sm
                    text-zinc-500
                    "
                  >

                    Trashure AI Analysis

                  </p>



                  <h3
                    className="
                    mt-3
                    text-2xl
                    font-bold
                    "
                  >

                    Plastic Bottle

                  </h3>



                  <div
                    className="
                    mt-5
                    grid
                    gap-3
                    sm:grid-cols-2
                    "
                  >

                    <div
                      className="
                      rounded-2xl
                      bg-green-50
                      p-4
                      "
                    >

                      <p className="text-sm text-zinc-500">
                        Material
                      </p>

                      <p className="font-semibold">
                        PET Plastic
                      </p>

                    </div>


                    <div
                      className="
                      rounded-2xl
                      bg-green-50
                      p-4
                      "
                    >

                      <p className="text-sm text-zinc-500">
                        Recovery
                      </p>

                      <p className="font-semibold text-green-700">
                        High
                      </p>

                    </div>


                  </div>



                  <div
                    className="
                    mt-5
                    rounded-2xl
                    bg-green-600
                    p-4
                    text-center
                    text-white
                    "
                  >

                    Recommended:
                    <br />

                    Reuse • Sell • Donate • Recycle

                  </div>


                </div>


              </div>


            </Card>



          </div>


        </div>


      </section>





      {/* UVP Section */}



      <section className="py-28">


        <div
          className="
          mx-auto
          max-w-6xl
          px-5
          sm:px-8
          "
        >


          <div className="text-center">


            <Badge
              className="
              rounded-full
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >

              Unique Value Proposition

            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              We don't just identify waste.

              <br />

              We reveal possibilities.

            </h2>


          </div>




          <div
            className="
            mt-14
            grid
            gap-6
            md:grid-cols-2
            "
          >


            <Card
              className="
              rounded-[32px]
              border-none
              bg-zinc-50
              p-10
              "
            >

              <h3
                className="
                text-2xl
                font-bold
                text-zinc-500
                "
              >

                Traditional Approach

              </h3>


              <div className="mt-8 space-y-4 text-zinc-600">


                <p>
                  Identify material
                </p>


                <p>
                  ↓
                </p>


                <p>
                  Throw away or recycle
                </p>


              </div>


            </Card>




            <Card
              className="
              rounded-[32px]
              border-none
              bg-gradient-to-br
              from-green-500
              to-emerald-700
              p-10
              text-white
              "
            >

              <h3
                className="
                text-2xl
                font-bold
                "
              >

                Trashure Approach

              </h3>



              <div className="mt-8 space-y-4">


                <p>
                  Identify material
                </p>


                <p>
                  ↓
                </p>


                <p>
                  Understand value
                </p>


                <p>
                  ↓
                </p>


                <p>
                  Reuse • Sell • Donate • Recycle
                </p>


              </div>


            </Card>


          </div>


        </div>


      </section>






      {/* LGU Dashboard */}



      <section
        id="dashboard"
        className="
        bg-green-50
        py-28
        "
      >


        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          sm:px-8
          "
        >


          <div className="text-center">


            <Badge
              className="
              rounded-full
              bg-white
              px-4
              py-2
              text-green-700
              "
            >

              LGU Intelligence

            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              Individual actions.

              <br />

              City-wide intelligence.

            </h2>



            <p
              className="
              mx-auto
              mt-5
              max-w-2xl
              text-zinc-600
              "
            >

              Every scan creates anonymous material insights
              that help cities design smarter sustainability programs.

            </p>


          </div>





          <Card
            className="
            mt-14
            rounded-[36px]
            border-none
            bg-white
            p-8
            shadow-xl
            "
          >


            <div
              className="
              grid
              gap-6
              md:grid-cols-3
              "
            >


              {[
                ["Plastic Recovered", "2,500 kg"],
                ["Active Communities", "25 Barangays"],
                ["Waste Prevented", "4.5 Tons"],
              ].map(([label, value]) => (


                <div
                  key={label}
                  className="
                  rounded-3xl
                  bg-green-50
                  p-8
                  "
                >

                  <p className="text-zinc-500">
                    {label}
                  </p>


                  <h3
                    className="
                    mt-3
                    text-3xl
                    font-bold
                    text-green-700
                    "
                  >

                    {value}

                  </h3>


                </div>


              ))}


            </div>


          </Card>


        </div>


      </section>






      {/* Final CTA */}



      <section
        className="
        bg-gradient-to-r
        from-green-600
        to-emerald-700
        py-28
        text-center
        text-white
        "
      >


        <div
          className="
          mx-auto
          max-w-5xl
          px-5
          "
        >


          <h2
            className="
            text-4xl
            font-bold
            sm:text-6xl
            "
          >

            Before you throw it away...

            <br />

            Ask what it can become.

          </h2>



          <Button
            className="
            mt-10
            rounded-full
            bg-white
            px-12
            py-7
            text-base
            text-green-700
            shadow-xl
            hover:bg-white
            "
          >

            <Upload className="mr-2" />

            Discover Your Material

          </Button>


        </div>


      </section>






      {/* Footer */}

      <footer
        id="about"
        className="bg-zinc-950 py-16 text-zinc-300"
      >

        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-4 sm:px-8">

          <div>
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Trashure"
                className="h-12 w-12 rounded-xl object-contain bg-white p-1"
              />

              <h2 className="text-3xl font-black text-green-400">
                TRASHURE
              </h2>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-zinc-400">
              AI-powered circular economy platform turning discarded materials
              into valuable resources.
            </p>
          </div>


          <div>
            <h3 className="font-bold text-white">Platform</h3>
            <div className="mt-5 space-y-3 text-sm">
              <p>AI Scanner</p>
              <p>Material Intelligence</p>
              <p>Partner Network</p>
              <p>LGU Dashboard</p>
            </div>
          </div>


          <div>
            <h3 className="font-bold text-white">Community</h3>
            <div className="mt-5 space-y-3 text-sm">
              <p>Residents</p>
              <p>Schools</p>
              <p>Recyclers</p>
              <p>LGU Partners</p>
            </div>
          </div>


          <div>
            <h3 className="font-bold text-white">
              Resources
            </h3>

            <div className="mt-5 space-y-3 text-sm">

              <Link
                href="/documentation"
                className="block transition hover:text-green-400"
              >
                Documentation
              </Link>


              <Link
                href="/privacy"
                className="block transition hover:text-green-400"
              >
                Privacy Policy
              </Link>


              <Link
                href="/terms"
                className="block transition hover:text-green-400"
              >
                Terms
              </Link>


              <Link
                href="/contact"
                className="block transition hover:text-green-400"
              >
                Contact
              </Link>

            </div>
          </div>

        </div>


        <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-4 border-t border-zinc-800 px-5 pt-8 text-sm sm:px-8 md:flex-row">

          <p>
            © 2026 Trashure. All rights reserved.
          </p>

          <p>
            Developed by
            <span className="ml-1 font-semibold text-green-400">
              Jaymar Maruji
            </span>
          </p>

        </div>

      </footer>

      <DownloadApkPrompt />
    </main>

  );

}
