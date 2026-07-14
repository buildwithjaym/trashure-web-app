import ResourceHeader from "@/components/ResourceHeader";
import {
    Mail,
    Building2,
    Recycle,
    School,
} from "lucide-react";


export const metadata = {
    title: "Contact Trashure"
};


export default function ContactPage() {


    const contacts = [

        {
            icon: Mail,
            title: "General Support",
            email: "support@trashure.com",
            text: "For account concerns, technical questions, and platform assistance."
        },

        {
            icon: Building2,
            title: "LGU Partnership",
            email: "lgu@trashure.com",
            text: "For municipalities and government sustainability programs."
        },

        {
            icon: Recycle,
            title: "Recycler Partnership",
            email: "partners@trashure.com",
            text: "For junkshops and recycling organizations joining the network."
        },

        {
            icon: School,
            title: "School Partnership",
            email: "schools@trashure.com",
            text: "For schools interested in donation and sustainability projects."
        }

    ];


    return (

        <main className="min-h-screen bg-white">


            <ResourceHeader

                title="Contact Trashure"

                description="Join the movement to turn discarded materials into valuable community resources."

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


                    {contacts.map((item) => (


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


                            <h2
                                className="
mt-6
text-xl
font-bold
"
                            >

                                {item.title}

                            </h2>


                            <p
                                className="
mt-3
text-zinc-600
"
                            >

                                {item.text}

                            </p>


                            <p
                                className="
mt-5
font-semibold
text-green-700
"
                            >

                                {item.email}

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