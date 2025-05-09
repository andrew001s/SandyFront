import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dot } from "lucide-react";

export const HeaderContent = () => {
  return (
    <div className="flex flex-row pr-4 text-justify items-center justify-center self-center bg-sidebar">
      <div className="flex flex-row space-x-2 z-10 -mt-1.5 items-center">
        <Dot className="text-chart-2 -mr-3" size={48} />
        <span className="pr-4 text-xl -mr-3">Shandrew</span>
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
      <div className="bg-sidebar pb-18 absolute top-0 left-0 w-full" />
    </div>
  );
};
