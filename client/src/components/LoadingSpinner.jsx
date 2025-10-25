import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ size = "default", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-black dark:text-white mb-4`}
      />
      <p className="text-black dark:text-white">{text}</p>
    </div>
  );
};

export default React.memo(LoadingSpinner);
