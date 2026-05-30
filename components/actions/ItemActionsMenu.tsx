import { useState } from "react";

import { ActionMenuButton } from "./ActionMenuButton";
import type { ActionMenuItem, ItemAction } from "./actions";

interface ItemActionsMenuProps {
  badgeCount?: number;
  items: ActionMenuItem[];
  onSelect: (action: ItemAction) => void;
}

export function ItemActionsMenu({
  badgeCount,
  items,
  onSelect,
}: ItemActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ActionMenuButton
      badgeCount={badgeCount}
      isOpen={isOpen}
      items={items}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      onSelect={onSelect}
    />
  );
}
