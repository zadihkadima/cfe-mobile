import { PropsWithChildren } from "react";
import { View } from "react-native";

import clsx from "clsx";

interface Props extends PropsWithChildren {

  className?: string;

}

export function Card({

  children,

  className,

}: Props) {

  return (

    <View

      className={clsx(

        "rounded-3xl",

        "p-5",

        "bg-surface",

        "dark:bg-dark-surface",

        "border",

        "border-border",

        "dark:border-dark-border",

        className,

      )}

    >

      {children}

    </View>

  );

}