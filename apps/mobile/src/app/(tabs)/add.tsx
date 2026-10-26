import {
  copy,
  EMPTY_SUBMISSION_FORM,
  firstErrorSection,
  isDemoDataError,
  issuesToSubmissionErrors,
  KERALA_DISTRICTS,
  LIMITS,
  MAX_SUBMISSION_PHOTOS,
  radii,
  semanticColors,
  spacing,
  SUBMISSION_FORM_SECTIONS,
  toNewSubmissionInput,
  validateSubmissionForm,
  validateSubmissionSection,
  type Submission,
  type SubmissionFormErrors,
  type SubmissionFormValues,
} from '@hiddenspot/shared';
import { useCatalog, useCurrentUser, useDataService, useToast } from '@hiddenspot/shared/react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FadeIn,
  Button,
  CategoryIcon,
  ChipGroup,
  ConfirmDialog,
  FilterChip,
  Icon,
  IconButton,
  SelectField,
  SpotImage,
  StatusBadge,
  StepProgress,
  Text,
  TextArea,
  TextField,
  ValidationMessage,
  useBottomNavClearance,
  useGutter,
} from '@/ui';

const STEPS = SUBMISSION_FORM_SECTIONS;
const MAX_PHOTOS = MAX_SUBMISSION_PHOTOS;
type FormState = SubmissionFormValues;
type Errors = SubmissionFormErrors;
const EMPTY_FORM = EMPTY_SUBMISSION_FORM;
const validateStep = validateSubmissionSection;

export default function AddSpotScreen() {
  const gutter = useGutter();
  const clearance = useBottomNavClearance();
  const data = useDataService();
  const user = useCurrentUser();
  const { categories } = useCatalog();
  const { showToast } = useToast();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [created, setCreated] = useState<Submission | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(EMPTY_FORM);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const goTo = (next: number) => {
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const next = () => {
    const stepErrors = validateStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length === 0) goTo(step + 1);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setStep(0);
    setCreated(null);
  };

  const fillCurrentPosition = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setErrors((e) => ({
          ...e,
          latitude: 'Location permission was not granted. You can type coordinates instead.',
        }));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setForm((f) => ({
        ...f,
        latitude: position.coords.latitude.toFixed(5),
        longitude: position.coords.longitude.toFixed(5),
      }));
      setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined }));
    } catch {
      setErrors((e) => ({
        ...e,
        latitude: copy.location.coordinatesUnavailable,
      }));
    } finally {
      setLocating(false);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_PHOTOS - form.imageUris.length,
        quality: 0.7,
      });
      if (result.canceled) return;
      set(
        'imageUris',
        [...form.imageUris, ...result.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS),
      );
    } catch {
      setErrors((e) => ({ ...e, imageUris: 'Photos could not be opened on this device.' }));
    }
  };

  const submit = async () => {
    const all = validateSubmissionForm(form);
    if (Object.keys(all).length > 0) {
      setErrors(all);
      goTo(firstErrorSection(all));
      return;
    }
    if (!user.data) return;
    setSubmitting(true);
    try {
      const submission = await data.addDemoSubmission(toNewSubmissionInput(form, user.data.id));
      setCreated(submission);
      showToast({
        title: 'Spot submitted',
        message: 'It is now waiting for review.',
        tone: 'success',
      });
    } catch (error) {
      if (isDemoDataError(error) && error.issues.length) {
        const fieldErrors = issuesToSubmissionErrors(error.issues);
        setErrors(fieldErrors);
        goTo(firstErrorSection(fieldErrors));
      } else {
        showToast({ title: 'Could not submit', message: 'Please try again.', tone: 'danger' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[
            styles.success,
            { paddingHorizontal: gutter, paddingBottom: clearance },
          ]}
        >
          {/* Fades in to confirm the submission went through. */}
          <FadeIn style={styles.successIcon}>
            <Icon name="check" size="xl" color={semanticColors.onPrimary} />
          </FadeIn>
          <Text variant="h1" align="center">
            Thanks for sharing
          </Text>
          <Text variant="body" tone="secondary" align="center">
            {created.place.name} is waiting for a moderator to review it. It will not appear in
            Explore until it is approved.
          </Text>
          <StatusBadge status={created.status} />
          <Text variant="helper" tone="tertiary" align="center">
            This is a demo. Your submission is stored on this device only.
          </Text>
          <View style={styles.successActions}>
            <Button onPress={() => router.push('/profile')} leadingIcon="user" fullWidth>
              View in your profile
            </Button>
            <Button variant="secondary" onPress={reset} fullWidth>
              Add another spot
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <View style={styles.titleRow}>
            <Text variant="h1" style={styles.flex}>
              Add a spot
            </Text>
            {dirty ? (
              <Button variant="ghost" size="sm" onPress={() => setConfirmCancel(true)}>
                Cancel
              </Button>
            ) : null}
          </View>
          <StepProgress step={step + 1} total={STEPS.length} label={STEPS[step] ?? ''} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.body, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {step === 0 ? (
            <>
              <TextField
                label="Place name"
                required
                value={form.name}
                onChangeText={(v) => set('name', v)}
                error={errors.name}
                maxLength={LIMITS.placeName.max}
                hint="The name locals use, if you know it."
              />
              <View style={styles.field}>
                <Text variant="label">
                  Category{' '}
                  <Text variant="label" tone="danger">
                    *
                  </Text>
                </Text>
                <ChipGroup layout="wrap">
                  {categories.map((c) => (
                    <FilterChip
                      key={c.id}
                      label={c.name}
                      selected={form.categoryIds.includes(c.id)}
                      onPress={() =>
                        set(
                          'categoryIds',
                          form.categoryIds.includes(c.id)
                            ? form.categoryIds.filter((x) => x !== c.id)
                            : [...form.categoryIds, c.id].slice(-LIMITS.categoriesPerPlace.max),
                        )
                      }
                      renderIcon={(color) => <CategoryIcon icon={c.icon} size="sm" color={color} />}
                    />
                  ))}
                </ChipGroup>
                {errors.categoryIds ? (
                  <ValidationMessage>{errors.categoryIds}</ValidationMessage>
                ) : (
                  <Text variant="helper" tone="secondary">
                    Choose up to {LIMITS.categoriesPerPlace.max}. The first is the main category.
                  </Text>
                )}
              </View>
              <TextField
                label="Short description"
                required
                value={form.shortDescription}
                onChangeText={(v) => set('shortDescription', v)}
                error={errors.shortDescription}
                maxLength={LIMITS.shortDescription.max}
                hint={`${form.shortDescription.trim().length}/${LIMITS.shortDescription.max}. One sentence that sums it up.`}
              />
              <TextArea
                label="Description"
                optional
                value={form.description}
                onChangeText={(v) => set('description', v)}
                error={errors.description}
                hint="What makes it special, how to get there, what to expect."
              />
            </>
          ) : null}

          {step === 1 ? (
            <>
              <SelectField
                label="District"
                required
                value={form.district}
                placeholder="Choose a district"
                options={KERALA_DISTRICTS.map((d) => ({ value: d, label: d }))}
                onChange={(v) => set('district', v)}
                error={errors.district}
              />
              <TextField
                label="Address or landmark"
                optional
                value={form.address}
                onChangeText={(v) => set('address', v)}
                hint="For example: near the temple car park."
              />
              <View style={styles.field}>
                <Text variant="label">Coordinates (optional)</Text>
                <Button
                  variant="secondary"
                  leadingIcon="crosshair"
                  loading={locating}
                  onPress={() => void fillCurrentPosition()}
                >
                  Use where I am now
                </Button>
                <Text variant="helper" tone="secondary">
                  Only if you are at the place. Or type the coordinates below.
                </Text>
              </View>
              <View style={styles.row}>
                <TextField
                  label="Latitude"
                  value={form.latitude}
                  onChangeText={(v) => set('latitude', v)}
                  keyboardType="numbers-and-punctuation"
                  placeholder="10.2847"
                  error={errors.latitude}
                  style={styles.flex}
                />
                <TextField
                  label="Longitude"
                  value={form.longitude}
                  onChangeText={(v) => set('longitude', v)}
                  keyboardType="numbers-and-punctuation"
                  placeholder="76.5686"
                  error={errors.longitude}
                  style={styles.flex}
                />
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <View style={styles.field}>
                <Text variant="label">Photos (optional)</Text>
                <View style={styles.photos}>
                  {form.imageUris.map((uri) => (
                    <View key={uri} style={styles.photo}>
                      <SpotImage uri={uri} alt="Selected photo" ratio="compact" rounded />
                      <IconButton
                        icon="x"
                        label="Remove photo"
                        size="sm"
                        variant="solid"
                        style={styles.removePhoto}
                        onPress={() =>
                          set(
                            'imageUris',
                            form.imageUris.filter((u) => u !== uri),
                          )
                        }
                      />
                    </View>
                  ))}
                  {form.imageUris.length < MAX_PHOTOS ? (
                    <Pressable
                      onPress={() => void pickImages()}
                      accessibilityRole="button"
                      accessibilityLabel="Add photos"
                      style={({ pressed }) => [
                        styles.photo,
                        styles.addPhoto,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Icon name="image" size="lg" color={semanticColors.primary} />
                      <Text variant="caption" tone="brand">
                        Add photos
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {errors.imageUris ? (
                  <ValidationMessage>{errors.imageUris}</ValidationMessage>
                ) : (
                  <Text variant="helper" tone="secondary">
                    Up to {MAX_PHOTOS} of your own photos. They stay on this device in the demo.
                  </Text>
                )}
              </View>
              <TextArea
                label="Safety information"
                optional
                value={form.safetyNotes}
                onChangeText={(v) => set('safetyNotes', v)}
                error={errors.safetyNotes}
                hint="One note per line. For example: slippery rocks after rain."
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <TextField
                label="Opening hours"
                optional
                value={form.openingHours}
                onChangeText={(v) => set('openingHours', v)}
                error={errors.openingHours}
                hint="Leave empty if you are not sure."
              />
              <View style={styles.field}>
                <Text variant="label">Entry fee</Text>
                <ChipGroup layout="wrap">
                  {(
                    [
                      ['unknown', 'Not sure'],
                      ['free', 'Free'],
                      ['paid', 'Paid'],
                    ] as const
                  ).map(([value, label]) => (
                    <FilterChip
                      key={value}
                      label={label}
                      selected={form.feeChoice === value}
                      onPress={() => set('feeChoice', value)}
                    />
                  ))}
                </ChipGroup>
              </View>
              {form.feeChoice === 'paid' ? (
                <TextField
                  label="Fee in rupees"
                  required
                  value={form.feeAmount}
                  onChangeText={(v) => set('feeAmount', v)}
                  keyboardType="number-pad"
                  error={errors.feeAmount}
                />
              ) : null}
              <View style={styles.summary}>
                <Text variant="overline" tone="secondary">
                  Review
                </Text>
                <Text variant="title">{form.name || 'Unnamed place'}</Text>
                <Text variant="bodySmall" tone="secondary">
                  {[
                    form.district || 'No district',
                    form.categoryIds.length ? `${form.categoryIds.length} categories` : null,
                    form.imageUris.length ? `${form.imageUris.length} photos` : 'No photos',
                    form.latitude ? 'Coordinates added' : 'No coordinates',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </>
          ) : null}

          <View style={[styles.actions, { paddingBottom: clearance }]}>
            {step > 0 ? (
              <Button variant="secondary" leadingIcon="arrow-left" onPress={() => goTo(step - 1)}>
                Back
              </Button>
            ) : (
              <View />
            )}
            {step < STEPS.length - 1 ? (
              <Button trailingIcon="arrow-right" onPress={next}>
                Next
              </Button>
            ) : (
              <Button
                leadingIcon="send"
                loading={submitting}
                onPress={() => void submit()}
                disabled={!user.data}
              >
                Submit for review
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={confirmCancel}
        tone="danger"
        title="Discard this spot?"
        message="Everything you have entered will be cleared."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          reset();
          router.navigate('/explore');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: semanticColors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  body: { gap: spacing.xl, paddingTop: spacing.sm },
  field: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photo: { width: 96 },
  addPhoto: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: semanticColors.borderStrong,
    backgroundColor: semanticColors.primarySubtle,
  },
  removePhoto: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  summary: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: semanticColors.surfaceSecondary,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  success: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxxl },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColors.primary,
  },
  successActions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
});
