import { useState } from "react";

import { ActionMenuButton } from "./ActionMenuButton";
import type { ActionMenuItem, ItemAction } from "./actions";

interface SectionActionsMenuProps {
  items: ActionMenuItem[];
  onSelect: (action: ItemAction) => void;
}

export function SectionActionsMenu({
  items,
  onSelect,
}: SectionActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ActionMenuButton
      isOpen={isOpen}
      items={items}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      onSelect={onSelect}
    />
  );
}
