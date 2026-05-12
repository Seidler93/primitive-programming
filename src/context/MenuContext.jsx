import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { menuButtonItemMap } from "../app/menuRoutes";
import {
  loadMenuButtonPreferences,
  normalizeMenuButtonPreferences,
  saveMenuButtonPreferences,
} from "../utils/appHelpers";

const MenuContext = createContext(null);

export function MenuProvider({ children, isMobileViewport, isTrainer, onOpenView }) {
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);
  const [menuPressHandled, setMenuPressHandled] = useState(false);
  const [menuButtonPreferences, setMenuButtonPreferences] = useState(loadMenuButtonPreferences);
  const menuLongPressTimer = useRef(null);

  useEffect(() => {
    if (!showNavMenu || typeof document === "undefined" || typeof window === "undefined") return undefined;

    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousStyles.overflow;
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.width = previousStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [showNavMenu]);

  useEffect(() => {
    saveMenuButtonPreferences(menuButtonPreferences);
  }, [menuButtonPreferences]);

  useEffect(() => () => {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
  }, []);

  const orderedMenuButtons = useMemo(() => {
    const normalized = normalizeMenuButtonPreferences(menuButtonPreferences);
    const hiddenIds = new Set(normalized.hidden);
    const applicableItems = normalized.order
      .map((id) => menuButtonItemMap[id])
      .filter(Boolean)
      .filter((item) => {
        if (item.trainerOnly && !isTrainer) return false;
        if (item.hideForTrainer && isTrainer) return false;
        if (item.hideOnMobile && isMobileViewport) return false;
        return true;
      });
    const visibleItems = applicableItems.filter((item) => !hiddenIds.has(item.id));
    if (!menuEditMode) return visibleItems.length ? visibleItems : [menuButtonItemMap.settings];
    return applicableItems;
  }, [isMobileViewport, isTrainer, menuButtonPreferences, menuEditMode]);
  const hiddenMenuButtonIds = useMemo(() => new Set(normalizeMenuButtonPreferences(menuButtonPreferences).hidden), [menuButtonPreferences]);

  function hideMenu() {
    setShowNavMenu(false);
    setMenuEditMode(false);
  }

  function startMenuButtonPress() {
    if (menuEditMode) return;
    setMenuPressHandled(false);
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = window.setTimeout(() => {
      setMenuPressHandled(true);
      setMenuEditMode(true);
    }, 600);
  }

  function stopMenuButtonPress() {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = null;
  }

  function handleMenuButtonClick(item) {
    if (menuPressHandled) {
      setMenuPressHandled(false);
      return;
    }
    if (menuEditMode) return;
    onOpenView(item.view);
    hideMenu();
  }

  function moveMenuButton(itemId, targetItemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const currentIndex = nextPreferences.order.indexOf(itemId);
      const nextIndex = nextPreferences.order.indexOf(targetItemId);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextPreferences.order.length) return nextPreferences;
      const nextOrder = [...nextPreferences.order];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return { ...nextPreferences, order: nextOrder };
    });
  }

  function toggleMenuButtonHidden(itemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const hidden = new Set(nextPreferences.hidden);
      if (hidden.has(itemId)) {
        hidden.delete(itemId);
      } else {
        hidden.add(itemId);
      }
      return { ...nextPreferences, hidden: [...hidden] };
    });
  }

  function resetMenuButtons() {
    setMenuButtonPreferences(normalizeMenuButtonPreferences());
  }

  const value = {
    handleMenuButtonClick,
    hiddenMenuButtonIds,
    hideMenu,
    menuEditMode,
    moveMenuButton,
    orderedMenuButtons,
    resetMenuButtons,
    setMenuEditMode,
    showMenu: () => setShowNavMenu(true),
    showNavMenu,
    startMenuButtonPress,
    stopMenuButtonPress,
    toggleMenuButtonHidden,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used within a MenuProvider.");
  return context;
}
