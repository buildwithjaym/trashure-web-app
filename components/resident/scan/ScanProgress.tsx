"use client";


import {
    useEffect,
    useState
} from "react";


import {
    Camera,
    Brain,
    Leaf,
    Recycle,
    CheckCircle2
} from "lucide-react";



const steps = [

    {
        title: "Reading your image",
        description: "Checking shape, color, and texture",
        icon: Camera
    },

    {
        title: "Identifying material",
        description: "Understanding what this item is made of",
        icon: Brain
    },

    {
        title: "Finding circular value",
        description: "Looking for reuse, selling, and recycling paths",
        icon: Leaf
    },

    {
        title: "Preparing discovery",
        description: "Creating your Trashure recommendation",
        icon: Recycle
    }

];





export default function ScanProgress() {


    const [active, setActive] = useState(0);

    const [progress, setProgress] = useState(12);



    useEffect(() => {


        const timer = setInterval(() => {


            setProgress((value) => {


                if (value >= 100) {

                    return 100;

                }


                return value + 8;


            });



        }, 700);



        return () => clearInterval(timer);


    }, []);





    useEffect(() => {


        const timer = setInterval(() => {


            setActive((current) => {


                if (current >= steps.length - 1) {

                    return current;

                }


                return current + 1;


            });


        }, 2200);



        return () => clearInterval(timer);


    }, []);







    return (


        <div className="overflow-hidden rounded-[36px] border border-green-100 bg-white p-8 shadow-xl">





            <div className="relative mx-auto flex h-32 w-32 items-center justify-center">



                <div className="absolute inset-0 animate-pulse rounded-full bg-green-100" />



                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-lg">


                    <Brain
                        size={38}
                    />


                </div>



            </div>







            <h2 className="mt-7 text-center text-2xl font-black text-zinc-900">

                Discovering your material

            </h2>


            <p className="mt-2 text-center text-sm text-zinc-500">

                Trashure AI is finding the best next purpose.

            </p>






            <div className="mt-7">



                <div className="flex justify-between text-sm font-semibold">


                    <span className="text-green-700">

                        Analyzing

                    </span>


                    <span className="text-zinc-500">

                        {progress}%

                    </span>


                </div>





                <div className="mt-3 h-3 overflow-hidden rounded-full bg-green-100">


                    <div

                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-700 transition-all duration-500"

                        style={{
                            width: `${progress}%`
                        }}

                    />


                </div>



            </div>








            <div className="mt-8 space-y-3">


                {
                    steps.map((step, index) => {


                        const Icon = step.icon;


                        const completed = index < active;

                        const current = index === active;



                        return (

                            <div

                                key={step.title}

                                className={`flex items-center gap-4 rounded-2xl p-4 transition-all duration-300

${current

                                        ?

                                        "bg-green-50 ring-1 ring-green-200"

                                        :

                                        "bg-zinc-50"

                                    }

`

                                }

                            >


                                <div

                                    className={`flex h-11 w-11 items-center justify-center rounded-full transition

${completed

                                            ?

                                            "bg-green-600 text-white"

                                            :

                                            current

                                                ?

                                                "bg-green-500 text-white"

                                                :

                                                "bg-white text-zinc-400"

                                        }

`

                                    }

                                >


                                    {

                                        completed

                                            ?

                                            <CheckCircle2 size={22} />

                                            :

                                            <Icon size={22} />

                                    }


                                </div>




                                <div>


                                    <p className="font-bold text-zinc-900">

                                        {step.title}

                                    </p>


                                    <p className="text-sm text-zinc-500">

                                        {step.description}

                                    </p>


                                </div>



                            </div>


                        )


                    })

                }


            </div>






            <div className="mt-7 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-center">


                <p className="text-sm font-medium text-green-800">

                    🌱 Turning waste information into opportunities

                </p>


            </div>





        </div>


    );


}