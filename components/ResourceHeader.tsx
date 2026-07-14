import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";


interface ResourceHeaderProps {
    title: string;
    description: string;
}


export default function ResourceHeader({
    title,
    description,
}: ResourceHeaderProps) {


    return (

        <header
            className="
border-b
bg-white/80
backdrop-blur-xl
"
        >


            <div
                className="
mx-auto
max-w-7xl
px-6
py-8
"
            >


                <Link
                    href="/"
                    className="
inline-flex
items-center
gap-2
rounded-full
bg-green-50
px-5
py-2
text-sm
font-medium
text-green-700
transition
hover:bg-green-100
"
                >

                    <ArrowLeft
                        className="
h-4
w-4
"
                    />

                    Back to Trashure

                </Link>



                <div
                    className="
mt-10
flex
flex-col
gap-6
sm:flex-row
sm:items-center
"
                >


                    <div
                        className="
flex
h-20
w-20
shrink-0
items-center
justify-center
overflow-hidden
rounded-3xl
bg-green-50
shadow-sm
"
                    >

                        <Image
                            src="/logo.png"
                            alt="Trashure Logo"
                            width={80}
                            height={80}
                            className="
h-full
w-full
object-contain

"
                        />


                    </div>



                    <div
                        className="
flex
flex-col
"
                    >


                        <h1
                            className="
bg-gradient-to-r
from-green-500
via-emerald-500
to-green-700
bg-clip-text
text-3xl
font-black
tracking-tight
text-transparent
sm:text-4xl
"
                        >

                            {title}

                        </h1>



                        <p
                            className="
mt-3
max-w-2xl
text-base
leading-relaxed
text-zinc-600
"
                        >

                            {description}

                        </p>


                    </div>



                </div>


            </div>


        </header>

    );

}