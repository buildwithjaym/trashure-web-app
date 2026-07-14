import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ResidentHero from "@/components/resident/ResidentHero";
import ImpactCards from "@/components/resident/ImpactCards";
import MaterialPieChart from "@/components/resident/MaterialPieChart";
import WeeklyActivityChart from "@/components/resident/WeeklyActivityChart";
import RecentScans from "@/components/resident/RecentScans";



interface Scan {

    id: string;

    user_id: string;

    image_url: string | null;

    detected_object: string | null;

    material_type: string | null;

    category: string | null;

    confidence_score: number | null;

    recommended_action: unknown;

    action_taken: string | null;

    estimated_weight: number | null;

    estimated_value: number | null;

    created_at: string;

}





export default async function ResidentPage() {


    const supabase = await createClient();



    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();





    if (!user) {

        redirect("/login");

    }






    const {
        data: profile,
        error: profileError

    } = await supabase

        .from("profiles")

        .select(
            `
      id,
      full_name,
      avatar_url,
      barangay
    `
        )

        .eq("auth_id", user.id)

        .single();






    if (profileError || !profile) {

        redirect("/create-account");

    }







    const {
        data: scanResult,
        error: scanError

    } = await supabase

        .from("scans")

        .select("*")

        .eq("user_id", profile.id)

        .order(
            "created_at",
            {
                ascending: false
            }
        );







    const scans: Scan[] = scanResult ?? [];








    /*
      IMPACT CALCULATION
    */



    const totalMaterials = scans.length;



    const totalWeight = scans.reduce(

        (total, scan) => {

            return total + Number(scan.estimated_weight ?? 0);

        },

        0

    );





    const totalValue = scans.reduce(

        (total, scan) => {

            return total + Number(scan.estimated_value ?? 0);

        },

        0

    );








    /*
      MATERIAL CATEGORY DATA
    */



    const materialMap: Record<string, number> = {};





    scans.forEach((scan) => {


        const category =
            scan.category ??
            scan.material_type ??
            "Other";



        materialMap[category] =
            (materialMap[category] ?? 0) + 1;


    });





    const materialData = Object.entries(materialMap)

        .map(([name, value]) => ({

            name,

            value

        }));








    /*
      WEEKLY SCAN DATA
    */



    const weeklyData = [

        {
            day: "Mon",
            count: 0
        },

        {
            day: "Tue",
            count: 0
        },

        {
            day: "Wed",
            count: 0
        },

        {
            day: "Thu",
            count: 0
        },

        {
            day: "Fri",
            count: 0
        },

        {
            day: "Sat",
            count: 0
        },

        {
            day: "Sun",
            count: 0
        }

    ];







    scans.forEach((scan) => {


        const day =
            new Date(scan.created_at)
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                );



        const currentDay =
            weeklyData.find(
                item => item.day === day
            );



        if (currentDay) {

            currentDay.count++;

        }


    });









    return (


        <div className="space-y-8">






            <ResidentHero

                name={profile.full_name}

                avatar={profile.avatar_url}

                barangay={profile.barangay}

            />








            <section>


                <h2 className="text-2xl font-black text-zinc-900">

                    Your Circular Impact

                </h2>


                <p className="mt-1 text-sm text-zinc-500">

                    Every discovery helps materials find their next purpose.

                </p>


            </section>









            <ImpactCards

                total={totalMaterials}

                weight={
                    Number(totalWeight.toFixed(2))
                }

                value={
                    Number(totalValue.toFixed(2))
                }

            />









            <div className="grid gap-6 lg:grid-cols-2">



                <MaterialPieChart

                    data={
                        materialData.length > 0
                            ?
                            materialData
                            :
                            [
                                {
                                    name: "No scans yet",
                                    value: 1
                                }
                            ]
                    }

                />





                <WeeklyActivityChart

                    data={weeklyData}

                />



            </div>









            <RecentScans

                scans={scans.slice(0, 5)}

            />







        </div>


    );


}