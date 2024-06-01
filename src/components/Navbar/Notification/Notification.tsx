import NotificationItem from "@/components/Items/User/NotificationItem";
import { NotificationData, NotificationDocData } from "@/components/types/User";
import { auth, firestore } from "@/firebase/clientApp";
import {
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { GoDotFill } from "react-icons/go";
import { IoMdNotificationsOutline } from "react-icons/io";

export const Notification = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [lastOpenedTime, setLastOpenedTime] = useState(0);

  const [showFlag, setShowFlag] = useState(false);

  const [givenNotifications, setGivenNotifications] = useState<
    NotificationData[]
  >([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [getMoreNotifications, setGetMoreNotifications] = useState(false);

  useEffect(() => {
    const displayName = auth.currentUser?.displayName;
    if (!displayName) return;

    const notificationDocRef = doc(
      firestore,
      `/users/${displayName}/notifications/notifications`
    );

    const unsubscribe = onSnapshot(
      notificationDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return console.error(
            "Notification doc not exists from realtime listening."
          );
        }

        const notificationDocData = snapshot.data() as NotificationDocData;
        if (!notificationDocData) {
          return console.error("Notification data is undefined.");
        }

        const notificationsFetched = notificationDocData.notifications;
        const lastOpenedTimeFetched = notificationDocData.lastOpenedTime;

        if (modalOpen) {
          const notificationsSorted = notificationsFetched.toSorted(
            (a, b) => b.ts - a.ts
          );

          setNotifications(notificationsSorted);

          const unSeenNotifications = notificationsFetched.find(
            (notification) => lastOpenedTime < notification.ts
          );

          if (!unSeenNotifications) {
            setShowFlag(false);
          } else {
            setShowFlag(true);
          }
          return;
        }

        const notificationsSorted = notificationsFetched.toSorted(
          (a, b) => b.ts - a.ts
        );

        setNotifications(notificationsSorted);
        setLastOpenedTime(lastOpenedTimeFetched);

        const unSeenNotifications = notificationsFetched.find(
          (notification) => lastOpenedTimeFetched < notification.ts
        );
        if (!unSeenNotifications) {
          setShowFlag(false);
        } else {
          setShowFlag(true);
        }
      },
      (error) => {
        console.error("Error on realtime listening: \n", error);
      }
    );

    return () => unsubscribe();
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    handleUpdateNotificationLastOpenedTime();
  }, [modalOpen]);

  useEffect(() => {
    if (!getMoreNotifications) return;
    handleGetMoreNotifications();
  }, [getMoreNotifications]);

  useEffect(() => {
    if (modalOpen) {
      handleInitialNotificationLoading();
    } else {
      setGivenNotifications([]);
    }
  }, [notifications, modalOpen]);

  useEffect(() => {
    if (!modalOpen) {
      if (panelRef.current) {
        panelRef.current.removeEventListener("scroll", handleScroll);
      }
      return;
    }
    const panel = panelRef.current;
    if (panel) {
      panel.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (panel) {
        panel.removeEventListener("scroll", handleScroll);
      }
    };
  }, [modalOpen, notifications]);

  const handleUpdateNotificationLastOpenedTime = async () => {
    const currentUserAuthObject = auth.currentUser;
    if (!currentUserAuthObject) return false;

    try {
      const idToken = await currentUserAuthObject.getIdToken();

      const response = await fetch(
        "/api/user/notification/updateLastOpenedTime",
        {
          headers: {
            authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Response from updateLastOpenedTime is not okay: \n",
          await response.text()
        );
        return false;
      }

      // Everything is alright.

      return true;
    } catch (error) {
      console.error("Error on fetching to updateLastOpenedTime API: \n", error);
      return false;
    }
  };

  const handleInitialNotificationLoading = () => {
    setGetMoreNotifications(true);
  };

  const handleScroll = (): void => {
    if (!panelRef.current) return;
    if (!modalOpen) return;

    const panel = panelRef.current;

    const panelScrollHeight = panel.scrollHeight;

    const panelScrollTop = panel.scrollTop;
    const panellClientHeight = panel.clientHeight;

    const ratio = (panelScrollTop + panellClientHeight) / panelScrollHeight;

    if (ratio >= 0.8) {
      if (getMoreNotifications) return;
      setGetMoreNotifications(true);
    }
  };

  const handleGetMoreNotifications = () => {
    if (!getMoreNotifications) return;
    if (!modalOpen) return;
    if (notifications.length === 0) return;

    const sortedNotifications = notifications.toSorted((a, b) => b.ts - a.ts);

    const newNotifications = sortedNotifications.slice(
      givenNotifications.length,
      givenNotifications.length + 5
    );
    setGivenNotifications((prev) => [...prev, ...newNotifications]);

    setGetMoreNotifications(false);
  };

  return (
    <>
      <Flex
        id="notification-button"
        position="relative"
        cursor="pointer"
        onClick={() => {
          setModalOpen(true);
        }}
      >
        <Icon as={IoMdNotificationsOutline} color="white" fontSize="2xl" />
        {showFlag && (
          <Icon
            as={GoDotFill}
            color="red"
            position="absolute"
            width="14px"
            height="14px"
            right="0"
            top="0"
          />
        )}
      </Flex>
      <Modal
        size={{
          base: "full",
          sm: "full",
          md: "md",
          lg: "md",
        }}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        autoFocus={false}
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="auto" backdropBlur="8px" />
        <ModalContent
          bg="black"
          minHeight={{
            md: "500px",
            lg: "500px",
          }}
        >
          <ModalHeader color="white">Notifications</ModalHeader>
          <ModalCloseButton color="white" justifyContent="center" />

          <ModalBody display="flex" ref={panelRef}>
            <Stack gap={4} width="100%">
              {givenNotifications.map((n) => (
                <NotificationItem
                  cause={n.cause}
                  notificationTime={n.ts}
                  seen={lastOpenedTime > n.ts}
                  sender={n.sender}
                  setModalOpen={setModalOpen}
                  key={`${n.sender}-${n.ts}`}
                />
              ))}
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
