import ResourceHeader from "@/components/ResourceHeader";
import {
    ShieldCheck,
    Database,
    EyeOff,
    UserCheck,
} from "lucide-react";


export const metadata = {
    title: "Trashure Privacy Policy"
};


export default function PrivacyPage() {


    const sections = [

        {
            icon: Database,
            title: "Information We Collect",
            text: "Trashure collects only the information required to provide platform services. This may include account details, uploaded material scans, and activity records."
        },

        {
            icon: EyeOff,
            title: "Anonymous Waste Analytics",
            text: "Environmental analytics are designed to protect privacy. Trashure uses aggregated information to understand recovery trends without exposing individual user activity."
        },

        {
            icon: ShieldCheck,
            title: "Data Protection",
            text: "User information is protected through secure authentication, controlled database access, and responsible data management practices."
        },

        {
            icon: UserCheck,
            title: "Your Rights",
            text: "Users may request access, correction, or deletion of their personal information according to applicable privacy requirements."
        }

    ];


    return (

        <main className="min-h-screen bg-white">


            <ResourceHeader

                title="Privacy Policy"

                description="How Trashure protects user information while building a smarter circular economy."

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
                        Privacy at Trashure
                    </h2>


                    <p
                        className="
mt-4
max-w-3xl
leading-relaxed
text-zinc-600
"
                    >

                        Trashure believes sustainability and privacy must work together.
                        The platform collects information responsibly while ensuring
                        that community waste insights remain focused on environmental
                        improvement rather than individual tracking.

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