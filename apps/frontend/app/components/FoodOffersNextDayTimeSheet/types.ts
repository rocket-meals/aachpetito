export interface FoodOffersNextDayTimeSheetProps {
        closeSheet: () => void;
        initialValue?: string | null;
        onSave: (value: string) => void;
}
