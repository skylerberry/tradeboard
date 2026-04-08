import {
  DefaultContextMenu,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  useActions,
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

export default function CustomContextMenu(props: TLUiContextMenuProps) {
  return (
    <DefaultContextMenu {...props}>
      <TldrawUiMenuGroup id="actions">
        <ActionItem actionId="toggle-lock" />
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
