import ResourceHeader from "@/components/ResourceHeader";
import {
    FileCheck,
    Users,
    AlertTriangle,
    Handshake,
} from "lucide-react";


export const metadata = {
    title: "Trashure Terms of Service"
};


export default function TermsPage() {


    const sections = [

        {
            icon: FileCheck,
            title: "Platform Purpose",
            text: "Trashure provides AI-powered material recognition, circular recommendations, partner connections, and sustainability insights."
        },

        {
            icon: Users,
            title: "User Responsibilities",
            text: "Users agree to provide accurate information, use the platform responsibly, and participate respectfully within the circular economy ecosystem."
        },

        {
            icon: Handshake,
            title: "Partner Responsibilities",
            text: "Recycler, school, community, and LGU partners should provide accurate information about their services, requirements, and material availability."
        },

        {
            icon: AlertTriangle,
            title: "AI Recommendation Notice",
            text: "AI results are generated from image analysis and available knowledge. Actual material value and acceptance may vary depending on local conditions."
        }

    ];


    return (

        <main className="min-h-screen bg-white">


            <ResourceHeader

                title="Terms of Service"

                description="Guidelines for responsible participation in the Trashure circular economy ecosystem."

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
rounded-3xl
bg-green-50
p-8
"
                >


                    <h2 className="text-3xl font-black text-green-700">
                        Using Trashure Responsibly
                    </h2>


                    <p
                        className="
mt-4
max-w-3xl
leading-relaxed
text-zinc-600
"
                    >

                        Trashure exists to help communities recover valuable
                        materials. By using the platform, users agree to support
                        responsible material recovery practices and maintain
                        accurate information.

                    </p>


                </div>




                <div
                    className="
mt-10
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
p-8
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
leading-relaxed
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