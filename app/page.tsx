import {
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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export default function Home() {

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

          <div
            className="
            bg-gradient-to-r
            from-green-500
            via-emerald-500
            to-green-700
            bg-clip-text
            text-2xl
            font-black
            tracking-tight
            text-transparent
            "
          >
            TRASHURE
          </div>


          <div
            className="
hidden
items-center
gap-8
text-sm
text-zinc-600
md:flex
"
          >

            <a
              href="#features"
              className="hover:text-green-600 transition"
            >
              Features
            </a>


            <a
              href="#how-it-works"
              className="hover:text-green-600 transition"
            >
              How It Works
            </a>


            <a
              href="#dashboard"
              className="hover:text-green-600 transition"
            >
              Dashboard
            </a>


            <a
              href="#about"
              className="hover:text-green-600 transition"
            >
              About
            </a>

          </div>


          <Button
            className="
            rounded-full
            bg-gradient-to-r
            from-green-500
            to-emerald-700
            px-8
            py-6
            text-white
            shadow-xl
            shadow-green-500/30
            transition
            hover:-translate-y-1
            "
          >
            Scan Material
          </Button>


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


              <Button
                className="
                rounded-full
                bg-gradient-to-r
                from-green-500
                to-emerald-700
                px-10
                py-7
                text-base
                text-white
                shadow-xl
                shadow-green-500/30
                transition
                hover:-translate-y-1
                "
              >

                <ScanLine className="mr-2" />

                Discover Material Value

              </Button>



              <Button
                variant="outline"
                className="
                rounded-full
                border-green-200
                px-10
                py-7
                text-base
                text-green-700
                hover:bg-green-50
                "
              >

                How It Works

                <ArrowRight className="ml-2" />

              </Button>


            </div>



          </div>





          {/* AI Preview Card */}


          <Card
            className="
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
        id="works"
        className="
        bg-zinc-50
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
              bg-green-100
              px-4
              py-2
              text-green-700
              "
            >
              Simple Process
            </Badge>



            <h2
              className="
              mt-6
              text-4xl
              font-bold
              sm:text-5xl
              "
            >

              From a simple scan

              <br />

              to a circular action.

            </h2>


          </div>




          <div
            className="
            mt-14
            grid
            gap-6
            md:grid-cols-4
            "
          >



            {[
              ["01", "Scan", "Upload a photo of your material."],
              ["02", "Analyze", "AI identifies the object and material."],
              ["03", "Discover", "Receive the best recovery options."],
              ["04", "Recover", "Create environmental impact."]
            ].map(([number, title, text]) => (


              <Card
                key={number}
                className="
                rounded-[30px]
                border-none
                bg-white
                p-8
                "
              >


                <span
                  className="
                  text-5xl
                  font-black
                  text-green-100
                  "
                >

                  {number}

                </span>



                <h3
                  className="
                  mt-5
                  text-xl
                  font-bold
                  "
                >

                  {title}

                </h3>


                <p
                  className="
                  mt-3
                  text-zinc-600
                  "
                >

                  {text}

                </p>


              </Card>


            ))}



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
        className="
        py-14
        "
      >


        <div
          className="
          mx-auto
          max-w-7xl
          px-5
          text-center
          "
        >


          <div
            className="
            bg-gradient-to-r
            from-green-500
            via-emerald-500
            to-green-700
            bg-clip-text
            text-3xl
            font-black
            text-transparent
            "
          >

            TRASHURE

          </div>



          <p
            className="
            mt-4
            text-zinc-500
            "
          >

            Turn Trash Into Treasure

          </p>



          <p
            className="
            mt-6
            text-sm
            text-zinc-400
            "
          >

            Designed and Developed by

            <span
              className="
              font-semibold
              text-green-700
              "
            >

              {" "}Trashure Innovation Team

            </span>

          </p>



          <p
            className="
            mt-3
            text-xs
            text-zinc-400
            "
          >

            © 2026 Trashure. AI-powered circular economy platform.

          </p>


        </div>


      </footer>


    </main>

  );

}