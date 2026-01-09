import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import birthdayService from '../services/birthdayService';
import colors from '../constants/colors';

export default function BirthdayBanner() {
  const [birthdays, setBirthdays] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    const result = await birthdayService.getTodaysBirthdays();
    if (result.success && result.data.length > 0) {
      setBirthdays(result.data);
    }
  };

  if (birthdays.length === 0) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => setShowModal(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FF6B9D', '#FFA06B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.icon}>🎉</Text>
          <View style={styles.content}>
            <Text style={styles.title}>
              {birthdays.length === 1
                ? `It's ${birthdays[0].name}'s Birthday!`
                : `${birthdays.length} Birthdays Today!`}
            </Text>
            <Text style={styles.subtitle}>Tap to celebrate 🎂</Text>
          </View>
          <Text style={styles.icon}>🎈</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#FF6B9D', '#FFA06B']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>🎉 Birthday Celebration! 🎂</Text>
            </LinearGradient>

            <ScrollView style={styles.birthdayList}>
              {birthdays.map((person, index) => (
                <View key={person._id} style={styles.birthdayCard}>
                  <LinearGradient
                    colors={colors.gradients.primary}
                    style={styles.profileCircle}
                  >
                    <Text style={styles.profileInitial}>{person.profileInitial}</Text>
                  </LinearGradient>
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName}>{person.name}</Text>
                    <Text style={styles.birthdayAge}>
                      Turning {person.age} today! 🎈
                    </Text>
                    <Text style={styles.birthdayRole}>{person.role.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.cakeIcon}>🎂</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <LinearGradient
                colors={colors.gradients.primary}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    ...colors.shadows.medium,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  birthdayList: {
    padding: 20,
  },
  birthdayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  birthdayInfo: {
    flex: 1,
    marginLeft: 12,
  },
  birthdayName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  birthdayAge: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  birthdayRole: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  cakeIcon: {
    fontSize: 32,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});