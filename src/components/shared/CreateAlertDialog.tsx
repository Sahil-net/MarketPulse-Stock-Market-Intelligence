import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BellPlus } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';

interface CreateAlertDialogProps {
  symbol: string;
  name: string;
  currentPrice: number;
  trigger?: React.ReactNode;
  onCreated?: () => void;
}

export function CreateAlertDialog({
  symbol, name, currentPrice, trigger, onCreated,
}: CreateAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const store = useAppStore();

  useEffect(() => {
    if (open) {
      setDirection('above');
      setTargetPrice(currentPrice.toFixed(2));
    }
  }, [open, currentPrice]);

  async function handleCreate() {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    setSubmitting(true);
    const created = await store.addPriceAlert({ symbol, name, direction, targetPrice: price });
    setSubmitting(false);
    if (!created) return;
    setOpen(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <BellPlus className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Price Alert</DialogTitle>
          <DialogDescription>
            Get notified when {name} ({symbol}) crosses your target price.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Alert me when the price goes</Label>
            <RadioGroup
              value={direction}
              onValueChange={(v) => setDirection(v as 'above' | 'below')}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="above" id="dir-above" />
                <Label htmlFor="dir-above" className="cursor-pointer">Above</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="below" id="dir-below" />
                <Label htmlFor="dir-below" className="cursor-pointer">Below</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-price">Target Price (USD)</Label>
            <Input
              id="target-price"
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              Current price: ${currentPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={submitting || !targetPrice}>
            {submitting ? 'Creating...' : 'Create Alert'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
