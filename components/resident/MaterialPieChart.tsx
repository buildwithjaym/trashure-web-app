"use client";


import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip
} from "recharts";


interface ChartProps {

    data: {
        name: string;
        value: number;
    }[];

}



export default function MaterialPieChart({
    data
}: ChartProps) {


    return (

        <div className="h-[320px] rounded-3xl border border-green-100 bg-white p-5 shadow-sm">


            <h2 className="text-lg font-bold text-zinc-900">
                Material Discovery
            </h2>


            <p className="mt-1 text-sm text-zinc-500">
                Your scanned materials breakdown
            </p>



            <div className="mt-5 h-[260px] min-h-[260px] w-full">


                <ResponsiveContainer width="100%" height={260}>


                    <PieChart>


                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={80}
                        >


                            {
                                data.map((item, index) => (

                                    <Cell key={index} />

                                ))
                            }


                        </Pie>


                        <Tooltip />

                        <Legend />


                    </PieChart>


                </ResponsiveContainer>


            </div>


        </div>

    );


}