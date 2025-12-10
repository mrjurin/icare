"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const IssueFormModal = dynamic(() => import("./IssueFormModal"), {
  ssr: false,
});

type Props = {
  trigger: ReactNode;
};

export default function IssueFormModalWrapper({ trigger }: Props) {
  return <IssueFormModal trigger={trigger} />;
}
