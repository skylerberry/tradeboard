import {
  DefaultContextMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  useActions,
  useEditor,
  type TLUiContextMenuProps,
} from "tldraw";

function ActionItem({ actionId }: { actionId: string }) {
  const actions = useActions();
  const action = actions[actionId];
  return (
    <TldrawUiMenuItem
      id={action.id}
      label={action.label}
      kbd={action.kbd}
      icon={action.icon as string | undefined}
      onSelect={action.onSelect}
    />
  );
}

function LockItem() {
  const actions = useActions();
  const editor = useEditor();
  const action = actions["toggle-lock"];
  const selectedShapes = editor.getSelectedShapes();
  const allLocked = selectedShapes.length > 0 && selectedShapes.every((s) => s.isLocked);

  return (
    <TldrawUiMenuItem
      id={action.id}
      label={allLocked ? "Unlock" : "Lock"}
      kbd={action.kbd}
      icon={action.icon as string | undefined}
      onSelect={action.onSelect}
    />
  );
}

export default function CustomContextMenu(props: TLUiContextMenuProps) {
  return (
    <DefaultContextMenu {...props}>
      <TldrawUiMenuGroup id="actions">
        <LockItem />
        <ActionItem actionId="duplicate" />
      </TldrawUiMenuGroup>
      <TldrawUiMenuGroup id="reorder">
        <ActionItem actionId="bring-to-front" />
        <ActionItem actionId="bring-forward" />
        <ActionItem actionId="send-backward" />
        <ActionItem actionId="send-to-back" />
      </TldrawUiMenuGroup>
    </DefaultContextMenu>
  );
}
