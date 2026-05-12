import React from "react";
import { ArrowDown, ArrowUp, Dumbbell, Eye, EyeOff, GripVertical } from "lucide-react";

export function MenuPanel({
  hiddenMenuButtonIds,
  menuEditMode,
  onHandleMenuButtonClick,
  onHideMenu,
  onMoveMenuButton,
  onResetMenuButtons,
  onSetMenuEditMode,
  onStartMenuButtonPress,
  onStopMenuButtonPress,
  onToggleMenuButtonHidden,
  orderedMenuButtons,
}) {
  return (
    <div
      className="nav-menu-backdrop"
      role="presentation"
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerCancel={(event) => event.stopPropagation()}
      onClick={onHideMenu}
    >
      <div className="nav-menu-panel" role="dialog" aria-modal="true" aria-label="Main menu" onClick={(event) => event.stopPropagation()}>
        <div className="nav-menu-header">
          <Dumbbell size={22} />
          <strong>Primitive</strong>
          {menuEditMode && (
            <div className="nav-menu-edit-actions">
              <button type="button" onClick={onResetMenuButtons}>Reset</button>
              <button type="button" onClick={() => onSetMenuEditMode(false)}>Done</button>
            </div>
          )}
        </div>
        {orderedMenuButtons.map((item, index) => {
          const Icon = item.icon;
          const isHidden = hiddenMenuButtonIds.has(item.id);
          const previousItem = orderedMenuButtons[index - 1];
          const nextItem = orderedMenuButtons[index + 1];
          return (
            <div className={isHidden ? "menu-edit-row hidden" : "menu-edit-row"} key={item.id}>
              <button
                className="menu-link"
                type="button"
                onClick={() => onHandleMenuButtonClick(item)}
                onPointerDown={onStartMenuButtonPress}
                onPointerUp={onStopMenuButtonPress}
                onPointerCancel={onStopMenuButtonPress}
                onPointerLeave={onStopMenuButtonPress}
                aria-disabled={menuEditMode}
                title={menuEditMode ? "Editing menu" : "Long press to edit menu"}
              >
                {menuEditMode && <GripVertical className="menu-drag-icon" size={16} />}
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
              {menuEditMode && (
                <div className="menu-edit-controls" aria-label={`${item.label} menu controls`}>
                  <button type="button" onClick={() => previousItem && onMoveMenuButton(item.id, previousItem.id)} disabled={!previousItem} aria-label={`Move ${item.label} up`}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" onClick={() => nextItem && onMoveMenuButton(item.id, nextItem.id)} disabled={!nextItem} aria-label={`Move ${item.label} down`}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" onClick={() => onToggleMenuButtonHidden(item.id)} aria-label={isHidden ? `Show ${item.label}` : `Hide ${item.label}`}>
                    {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
