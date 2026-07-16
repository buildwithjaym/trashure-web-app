import { Skeleton } from "@/components/ui/skeleton";


export default function LguLoading() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-72 rounded-[30px] bg-green-100" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <Skeleton
              key={
                index
              }
              className="h-40 rounded-[26px] bg-green-100"
            />
          ),
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <Skeleton
              key={
                index
              }
              className="h-24 rounded-[22px] bg-green-100"
            />
          ),
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />

        <Skeleton className="h-[520px] rounded-[28px] bg-green-100" />
      </div>

      <Skeleton className="h-[560px] rounded-[28px] bg-green-100" />
    </div>
  );
}
