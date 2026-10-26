import { semanticColors } from '@hiddenspot/shared';
import Tabs from 'expo-router/js-tabs';
import {
  BottomNavItem,
  bottomNavStyles,
  useBottomNavStyle,
  useReducedMotion,
  type IconName,
} from '@/ui';

const TABS: { name: string; title: string; icon: IconName; emphasis?: boolean }[] = [
  { name: 'explore', title: 'Explore', icon: 'compass' },
  { name: 'map', title: 'Map', icon: 'map' },
  { name: 'add', title: 'Add Spot', icon: 'plus', emphasis: true },
  { name: 'saved', title: 'Saved', icon: 'heart' },
  { name: 'profile', title: 'Profile', icon: 'user' },
];

/** Floating bottom navigation that respects the home indicator. */
export default function TabsLayout() {
  const barStyle = useBottomNavStyle();
  const reducedMotion = useReducedMotion();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // A short cross-fade marks the change of tab. Off when Reduce Motion is on.
        animation: reducedMotion ? 'none' : 'fade',
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: barStyle,
        tabBarItemStyle: bottomNavStyles.item,
        sceneStyle: { backgroundColor: semanticColors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.emphasis ? 'Add a spot' : tab.title,
            tabBarIcon: ({ focused }) => (
              <BottomNavItem
                icon={tab.icon}
                label={tab.title}
                focused={focused}
                emphasis={tab.emphasis}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
