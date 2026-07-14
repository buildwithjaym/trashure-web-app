import ResourceHeader from "@/components/ResourceHeader";
import {
    Camera,
    Brain,
    Coins,
    Recycle,
    Handshake,
} from "lucide-react";


export default function HowItWorksPage() {


    const steps = [
        {
            number: "01",
            title: "Scan Your Material",
            description:
                "Upload a photo of an item you want to understand. Trashure AI analyzes the material and identifies what it is.",
            icon: Camera
        },

        {
            number: "02",
            title: "Understand Its Value",
            description:
                "Trashure identifies the material type, recovery potential, and possible circular opportunities.",
            icon: Brain
        },

        {
            number: "03",
            title: "Choose Its Next Purpose",
            description:
                "Receive recommendations whether the material can be reused, sold, donated, or recycled.",
            icon: Coins
        },

        {
            number: "04",
            title: "Return It Into Circulation",
            description:
                "Connect materials with communities, partners, and recovery networks.",
            icon: Recycle
        }

    ];


    return (

        <main className="min-h-screen bg-white text-zinc-900">


            <ResourceHeader

                title="How Trashure Works"

                description="
Trashure transforms discarded materials into opportunities by combining AI recognition with circular economy connections.
"

            />



            <section className="py-24">


                <div className="mx-auto max-w-7xl px-6">


                    <div className="grid gap-8 md:grid-cols-2">


                        {steps.map((step) => (


                            <div
                                key={step.number}
                                className="
rounded-[32px]
border
border-green-100
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
items-center
justify-between
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
text-green-700
"
                                    >

                                        <step.icon />

                                    </div>


                                    <span
                                        className="
text-4xl
font-black
text-green-100
"
                                    >

                                        {step.number}

                                    </span>


                                </div>



                                <h2
                                    className="
mt-8
text-2xl
font-bold
"
                                >

                                    {step.title}

                                </h2>



                                <p
                                    className="
mt-4
leading-relaxed
text-zinc-600
"
                                >

                                    {step.description}

                                </p>


                            </div>


                        ))}


                    </div>


                </div>


            </section>





            <section
                className="
bg-gradient-to-r
from-green-600
to-emerald-700
py-20
text-center
text-white
"
            >


                <h2
                    className="
text-4xl
font-bold
"
                >

                    Waste is not the end.

                </h2>


                <p
                    className="
mx-auto
mt-4
max-w-2xl
text-lg
text-green-50
"
                >

                    Trashure helps materials find their next purpose.

                </p>


            </section>



        </main>

    );

}