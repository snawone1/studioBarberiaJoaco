'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { styleAdvisorSchema, type StyleAdvisorFormValues, getAIStyleAdvice } from '@/app/actions';
import type { StyleRecommendationWithServicesOutput } from '@/ai/flows/style-recommendation-with-services';

const hairTypes = ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick'];
const faceShapes = ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Long'];

export default function StyleAdvisorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<StyleRecommendationWithServicesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StyleAdvisorFormValues>({
    resolver: zodResolver(styleAdvisorSchema),
    defaultValues: {
      hairType: '',
      faceShape: '',
      stylePreferences: '',
    },
  });

  async function onSubmit(data: StyleAdvisorFormValues) {
    setIsLoading(true);
    setRecommendation(null);
    setError(null);
    
    const result = await getAIStyleAdvice(data);
    
    if (result.success && result.data) {
      setRecommendation(result.data);
    } else {
      setError(result.message || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <PageHeader
        title="AI Style Advisor"
        description="Let our AI help you find the perfect hairstyle. Tell us about your hair and preferences."
      />
      <div className="grid md:grid-cols-2 gap-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-primary" />
              Find Your Next Look
            </CardTitle>
            <CardDescription>
              Fill in your details below and our AI will suggest styles tailored for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="hairType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hair Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your hair type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hairTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="faceShape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Face Shape</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your face shape" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {faceShapes.map((shape) => (
                            <SelectItem key={shape} value={shape.toLowerCase()}>
                              {shape}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stylePreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style Preferences</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., modern, low-maintenance, edgy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Advice...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Get Style Recommendation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div>
          {isLoading && (
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          )}
          {error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
              </CardContent>
            </Card>
          )}
          {recommendation && !isLoading && (
            <Card className="bg-secondary shadow-xl animate-fade-in">
              <CardHeader>
                <CardTitle className="text-2xl font-headline text-primary">Your Style Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Recommended Style:</h3>
                  <p className="text-muted-foreground">{recommendation.styleRecommendation}</p>
                </div>
                {recommendation.relevantServices && recommendation.relevantServices.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Suggested Services:</h3>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {recommendation.relevantServices.map((service, index) => (
                        <li key={index}>{service}</li>
                      ))}
                    </ul>
                  </div>
                )}
                 <Button asChild className="mt-6">
                    <Link href="/book">Book this Style</Link>
                  </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
