export default function ProposalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  console.log('Layout params:', params);
  return children;
} 