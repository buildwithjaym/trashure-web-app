import Link from "next/link";
import { MapPin, ScanLine } from "lucide-react";


interface ResidentHeroProps {

    name: string;

    avatar: string | null;

    barangay: string | null;

}



export default function ResidentHero({
    name,
    avatar,
    barangay
}: ResidentHeroProps) {


    return (

        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 p-6 text-white shadow-xl sm:p-8">


            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-green-300/20 blur-3xl" />




            <div className="relative z-10">


                <div className="flex items-center gap-4">


                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white shadow-lg">


                        {
                            avatar ? (

                                <img
                                    src={avatar}
                                    alt={`${name} profile`}
                                    className="h-full w-full object-cover"
                                />

                            )

                                :

                                (

                                    <span className="text-2xl font-black text-green-700">

                                        {name.charAt(0).toUpperCase()}

                                    </span>

                                )

                        }


                    </div>




                    <div>


                        <h1 className="text-xl font-black sm:text-2xl">

                            Hello, {name} 👋

                        </h1>



                        <div className="mt-1 flex items-center gap-1 text-sm text-green-100">

                            <MapPin size={15} />

                            {barangay || "Your community"}

                        </div>


                    </div>


                </div>







                <div className="mt-8 max-w-xl">


                    <h2 className="text-3xl font-black leading-tight sm:text-4xl">

                        Discover the value hidden in your materials.

                    </h2>



                    <p className="mt-3 text-sm leading-relaxed text-green-100 sm:text-base">

                        Scan anything you want to throw away and discover whether it can be reused, sold, donated, or recycled.

                    </p>


                </div>







                <Link
                    href="/profiles/resident/scan"
                    className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 font-bold text-green-700 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:w-fit"
                >


                    <ScanLine size={22} />

                    Scan Material


                </Link>



            </div>


        </section>

    );


}