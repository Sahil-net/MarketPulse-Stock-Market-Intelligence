import { PageHeader } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Scale, Shield, Eye, AlertTriangle, Mail } from 'lucide-react';

interface TermsOfServiceProps {
  navigate: (path: string) => void;
}

const SECTIONS = [
  {
    icon: FileText,
    title: '1. Acceptance of Terms',
    body: 'By accessing or using MarketPulse ("the Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this Service. The Service is provided for informational and research purposes only.',
  },
  {
    icon: Scale,
    title: '2. Not Financial Advice',
    body: 'MarketPulse is a market intelligence and data visualization platform. All content provided on the Service—including stock prices, ETF data, performance rankings, technical indicators, sector analysis, and news—is for informational purposes only and does not constitute financial, investment, trading, or other types of advice. You should consult a qualified financial advisor before making any investment decisions.',
  },
  {
    icon: Shield,
    title: '3. User Accounts & Security',
    body: 'To access certain features of the Service, you must create an account using email-based authentication. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.',
  },
  {
    icon: Eye,
    title: '4. Data Accuracy & Availability',
    body: 'While we strive to provide accurate and up-to-date market data through live data feeds and built-in datasets, we do not guarantee the completeness, reliability, or timeliness of any information on the Service. Market data may be delayed, incomplete, or subject to errors. Real-time data availability depends on third-party data providers and may experience interruptions.',
  },
  {
    icon: AlertTriangle,
    title: '5. Limitation of Liability',
    body: 'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. Under no circumstances shall MarketPulse, its operators, or data providers be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service, including but not limited to financial losses resulting from investment decisions made based on information obtained through the Service.',
  },
  {
    icon: FileText,
    title: '6. Acceptable Use',
    body: 'You agree not to use the Service to: (a) violate any laws or regulations, (b) infringe upon the rights of others, (c) attempt to gain unauthorized access to the Service or its systems, (d) use automated tools to scrape or extract data at excessive rates, (e) redistribute or resell data obtained from the Service without authorization, or (f) interfere with the proper functioning of the Service.',
  },
  {
    icon: Scale,
    title: '7. Intellectual Property',
    body: 'The Service, including its design, features, and original content, is the property of MarketPulse and is protected by intellectual property laws. Market data is sourced from third-party providers and is subject to their respective terms. You may not copy, modify, distribute, or create derivative works from the Service without prior written consent.',
  },
  {
    icon: Shield,
    title: '8. Privacy & Data Handling',
    body: 'Your account email, watchlists, portfolio holdings, and application settings are stored securely and are only accessible to you. We do not sell or share your personal data with third parties. Account deletion permanently removes all associated data. Further details are available in our Privacy Policy.',
  },
  {
    icon: AlertTriangle,
    title: '9. Modifications to Terms',
    body: 'We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting the updated terms on this page. Your continued use of the Service after any modifications constitutes acceptance of the revised terms. We encourage you to review this page periodically.',
  },
  {
    icon: FileText,
    title: '10. Termination',
    body: 'You may terminate your account at any time through the Settings page. Account deletion permanently erases all your data, including watchlists, portfolio holdings, and settings. We reserve the right to terminate or suspend access to the Service for any user who violates these terms.',
  },
];

export function TermsOfService({ navigate }: TermsOfServiceProps) {
  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Terms of Service"
        description="Last updated: October 2026"
      />

      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">Important Disclaimer</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              MarketPulse is a research and visualization tool, not a registered financial advisor.
              All data is provided for informational purposes only. Always consult a licensed
              professional before making investment decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="divide-y divide-border">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {section.body}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>Questions about these terms? Contact us at </span>
        <button
          onClick={() => navigate('/settings')}
          className="font-medium text-primary hover:underline"
        >
          support
        </button>
      </div>
    </div>
  );
}
