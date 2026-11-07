import React from "react";

import {
  View,
  Text,
} from "react-native";

interface SectionProps {

  title: string;

  description?: string;

  right?: React.ReactNode;

  children: React.ReactNode;

}

export function Section({

  title,

  description,

  right,

  children,

}: SectionProps) {

  return (

    <View className="mb-10">

      <View className="flex-row items-start justify-between">

        <View className="flex-1 pr-4">

          <Text className="text-2xl font-bold text-text dark:text-dark-text">

            {title}

          </Text>

          {description && (

            <Text className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">

              {description}

            </Text>

          )}

        </View>

        {right}
      </View>

      <View className="mt-6">

        {children}

      </View>

    </View>

  );

}