"use client";


import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";


interface ChartProps {

    data: {
        day: string;
        count: number;
    }[];

}



export default function WeeklyActivityChart({
    data
}: ChartProps) {


    return (

        <div className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">


            <h2 className="text-lg font-bold text-zinc-900">
                Weekly Activity
            </h2>


            <p className="mt-1 text-sm text-zinc-500">
                Your scanning activity
            </p>




            <div className="mt-5 h-[260px] min-h-[260px] w-full">


                <ResponsiveContainer width="100%" height={260}>


                    <BarChart data={data}>


                        <XAxis dataKey="day" />

                        <YAxis allowDecimals={false} />

                        <Tooltip />


                        <Bar dataKey="count" />


                    </BarChart>


                </ResponsiveContainer>


            </div>


        </div>

    );


}