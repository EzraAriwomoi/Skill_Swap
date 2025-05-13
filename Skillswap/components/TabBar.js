import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Feather from "react-native-vector-icons/Feather";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function TabBar({
  state,
  descriptors,
  navigation,
  unreadCount = 0,
}) {
  const insets = useSafeAreaInsets();

  // Calculate bottom padding based on safe area
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* Background blur effect */}
      {Platform.OS === "ios" ? (
        <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
      )}

      {/* Tab buttons */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Get icon based on route name
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Bookings":
              iconName = "calendar";
              break;
            case "Messages":
              iconName = "message-circle";
              break;
            case "Profile":
              iconName = "user";
              break;
            default:
              iconName = "circle";
          }

          // Show badge for Messages tab if there are unread messages
          const showBadge = route.name === "Messages" && unreadCount > 0;

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <Feather
                    name={iconName}
                    size={24}
                    color={isFocused ? "#00acc1" : "#888"}
                  />

                  {/* Badge for unread messages */}
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? "#00acc1" : "#888" },
                  ]}
                >
                  {label}
                </Text>

                {isFocused && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    zIndex: 1000,
    elevation: 10,
  },
  androidBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingTop: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconContainer: {
    position: "relative",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  activeIndicator: {
    position: "absolute",
    top: -10,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#00acc1",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
