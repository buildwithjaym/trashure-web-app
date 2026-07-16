"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Camera,
    Upload,
    Sparkles
} from "lucide-react";

import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import { compressImage } from "@/lib/compress-image";

import ScanProgress from "@/components/resident/scan/ScanProgress";



export default function ScanPage() {


    const router = useRouter();

    const supabase = createClient();


    const [image, setImage] = useState<File | null>(null);

    const [preview, setPreview] = useState("");

    const [loading, setLoading] = useState(false);





    const selectImage = async (file: File) => {


        try {


            toast.info("Optimizing image...");


            const compressed =
                await compressImage(file);



            setImage(compressed);



            setPreview(
                URL.createObjectURL(compressed)
            );



            toast.success(
                "Image ready."
            );


        }

        catch {

            toast.error(
                "Unable to process image."
            );

        }


    };







    const analyze = async () => {


        if (!image) {

            toast.error(
                "Please capture a material first."
            );

            return;

        }




        try {


            setLoading(true);





            const {
                data: {
                    user
                }

            } = await supabase.auth.getUser();





            if (!user) {

                router.push("/login");

                return;

            }





            const filePath =
                `scans/${user.id}/${Date.now()}.webp`;






            const { error: uploadError } =

                await supabase.storage

                    .from("trashure-images")

                    .upload(

                        filePath,

                        image,

                        {
                            contentType: "image/webp"
                        }

                    );






            if (uploadError)
                throw uploadError;






            const {

                data: urlData

            } = supabase.storage

                .from("trashure-images")

                .getPublicUrl(filePath);






            const response =
                await fetch(
                    "/api/analyze",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({

                            imageUrl:
                                urlData.publicUrl

                        })
                    }
                );





if (!response.ok) {

    const error =
        await response.json();

    console.error(
        error
    );


    throw new Error(
        error.details ||
        error.error ||
        "AI analysis failed"
    );

}





            const result =
                await response.json();







            const {
                data: profile

            } = await supabase

                .from("profiles")

                .select("id,barangay")

                .eq(
                    "auth_id",
                    user.id
                )

                .single();







            if (!profile) {

                throw new Error(
                    "Profile missing"
                );

            }








            const {

                data: scan

            } = await supabase

                .from("scans")

                .insert({

                    user_id: profile.id,

                    image_url: urlData.publicUrl,

                    detected_object:
                        result.object,

                    material_type:
                        result.material,

                    category:
                        result.category,

                    confidence_score:
                        result.confidence,

                    recommended_action:
                        result,

                    estimated_weight:
                        result.estimated_weight,

                    estimated_value:
                        result.estimated_value,

                    barangay:
                        profile.barangay


                })

                .select()

                .single();








            toast.success(
                "Material discovered!"
            );






            router.push(
                `/profiles/resident/result/${scan.id}`
            );




        }

        catch (error: any) {


            console.error(error);


            toast.error(
                error.message ||
                "Something went wrong"
            );


        }

        finally {


            setLoading(false);


        }



    };








    return (

        <main className="min-h-screen bg-green-50 px-4 py-6">


            <div className="mx-auto max-w-xl">





                <Link
                    href="/profiles/resident"
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-green-700"
                >

                    <ArrowLeft size={18} />

                    Back

                </Link>







                <div className="mt-6 rounded-[32px] border border-green-100 bg-white p-6 shadow-xl sm:p-8">





                    {
                        loading

                            ?

                            <ScanProgress />

                            :


                            <>

                                <h1 className="text-3xl font-black text-zinc-900">

                                    Scan Material

                                </h1>


                                <p className="mt-2 text-zinc-500">

                                    Show Trashure what you want to discover.

                                </p>







                                {
                                    preview

                                        ?

                                        <div className="mt-8">


                                            <img
                                                src={preview}
                                                alt="preview"
                                                className="h-80 w-full rounded-3xl object-cover"
                                            />




                                            <button

                                                onClick={analyze}

                                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-700 py-4 font-bold text-white shadow-lg shadow-green-500/30 hover:-translate-y-1"

                                            >

                                                <Sparkles size={20} />

                                                Discover Value

                                            </button>


                                        </div>


                                        :


                                        <div className="mt-8 space-y-5">



                                            <label className="flex cursor-pointer flex-col items-center rounded-[32px] bg-green-50 p-10 text-center transition hover:bg-green-100">


                                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">

                                                    <Camera size={36} />

                                                </div>


                                                <h2 className="mt-5 text-xl font-black">

                                                    Take a Photo

                                                </h2>


                                                <p className="mt-2 text-sm text-zinc-500">

                                                    Use your camera to identify a material.

                                                </p>


                                                <input

                                                    type="file"

                                                    accept="image/*"

                                                    capture="environment"

                                                    hidden

                                                    onChange={(e) => {

                                                        const file = e.target.files?.[0];

                                                        if (file)
                                                            selectImage(file);

                                                    }}

                                                />


                                            </label>






                                            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-4 font-bold text-zinc-700 hover:bg-zinc-50">


                                                <Upload size={20} />

                                                Choose Gallery


                                                <input

                                                    type="file"

                                                    accept="image/*"

                                                    hidden

                                                    onChange={(e) => {

                                                        const file = e.target.files?.[0];

                                                        if (file)
                                                            selectImage(file);

                                                    }}

                                                />


                                            </label>



                                        </div>

                                }


                            </>


                    }





                </div>


            </div>


        </main>

    );


}