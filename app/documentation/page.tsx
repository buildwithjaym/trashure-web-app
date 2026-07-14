import ResourceHeader from "@/components/ResourceHeader";
import {
    Brain,
    Recycle,
    Users,
    BarChart3
} from "lucide-react";


export const metadata = {
    title: "Trashure Documentation"
};



export default function DocumentationPage() {


    const sections = [

        {
            icon: Brain,
            title: "AI Material Recognition",
            text: "Trashure uses artificial intelligence to identify discarded objects, classify materials, and understand their recovery potential."
        },

        {
            icon: Recycle,
            title: "Circular Recommendations",
            text: "Instead of recommending disposal, Trashure provides recovery options including reuse, selling, donation, and recycling."
        },

        {
            icon: Users,
            title: "Partner Ecosystem",
            text: "Trashure connects residents, schools, recyclers, junkshops, and LGUs into one circular economy network."
        },

        {
            icon: BarChart3,
            title: "LGU Waste Intelligence",
            text: "Anonymous material data helps communities understand recovery trends and design better sustainability programs."
        }

    ];


    return (

        <main className="min-h-screen bg-white">


            <ResourceHeader

                title="Documentation"

                description="Learn how Trashure transforms waste into valuable resources through AI and circular economy technology."

            />



            <section
                className="
mx-auto
max-w-7xl
px-6
py-16
"
            >


                <div
                    className="
grid
gap-8
md:grid-cols-2
"
                >


                    {sections.map((item) => (


                        <div
                            key={item.title}
                            className="
rounded-3xl
border
bg-white
p-8
shadow-sm
transition
hover:-translate-y-1
hover:shadow-xl
"
                        >


                            <item.icon
                                className="
h-10
w-10
text-green-600
"
                            />


                            <h2
                                className="
mt-6
text-2xl
font-bold
"
                            >

                                {item.title}

                            </h2>


                            <p
                                className="
mt-4
leading-relaxed
text-zinc-600
"
                            >

                                {item.text}

                            </p>


                        </div>


                    ))}


                </div>


            </section>


            <footer
                className="
bg-zinc-950
py-8
text-center
text-zinc-400
"
            >

                © 2026 Trashure. Developed by Jaymar Maruji

            </footer>


        </main>

    )

}