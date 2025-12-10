"use client";

import dynamic from "next/dynamic";

const IssueActionsButton = dynamic(() => import("./IssueActionsButton"), {
  ssr: false,
});

type Props = {
  issueId: number;
  reporterId: number | null;
};

export default function IssueActionsButtonWrapper({ issueId, reporterId }: Props) {
  return <IssueActionsButton issueId={issueId} reporterId={reporterId} />;
}
