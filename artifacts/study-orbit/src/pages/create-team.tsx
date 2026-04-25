import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTeam } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters."),
  subject: z.string().min(1, "Please select a subject."),
  studyTime: z.string().min(1, "Please select a study time preference."),
  goalType: z.string().min(1, "Please select a goal type."),
  minSkillLevel: z.string().min(1, "Please select a minimum skill level."),
  requiredRoles: z.array(z.object({
    skillCategory: z.string().min(1, "Skill category is required"),
    count: z.coerce.number().min(1, "Must need at least 1")
  })).min(1, "At least one role is required")
});

export default function CreateTeam() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createTeam = useCreateTeam();

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      subject: "",
      studyTime: "",
      goalType: "",
      minSkillLevel: "Beginner",
      requiredRoles: [{ skillCategory: "", count: 1 }]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requiredRoles"
  });

  const onSubmit = (values: z.infer<typeof teamSchema>) => {
    createTeam.mutate(
      { data: values as any },
      {
        onSuccess: () => {
          toast({ title: "Fleet Established", description: "Your team is now broadcasting for members." });
          setLocation("/teams");
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to establish fleet." });
        }
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card className="glass-panel border-primary/30">
        <CardHeader>
          <CardTitle className="text-2xl font-mono text-primary">Establish New Fleet</CardTitle>
          <CardDescription className="text-muted-foreground font-mono">
            Configure parameters for your new study group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Fleet Designation (Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apollo 11" className="bg-background/50 border-primary/20 font-mono text-white focus-visible:ring-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Primary Mission (Subject)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Frontend">Frontend</SelectItem>
                          <SelectItem value="Backend">Backend</SelectItem>
                          <SelectItem value="AI/ML">AI/ML</SelectItem>
                          <SelectItem value="DSA">DSA</SelectItem>
                          <SelectItem value="Accounting">Accounting</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="studyTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Active Cycle</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select active time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                          <SelectItem value="Flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Objective Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Exam">Exam</SelectItem>
                          <SelectItem value="Project">Project</SelectItem>
                          <SelectItem value="Hackathon">Hackathon</SelectItem>
                          <SelectItem value="Practice">Practice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minSkillLevel"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel className="text-secondary-foreground font-mono uppercase text-xs tracking-wider">Minimum Required Rank</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 border-primary/20 text-white font-mono">
                            <SelectValue placeholder="Select min rank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-panel border-primary/30 text-white">
                          <SelectItem value="Beginner">Beginner (All Welcome)</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Expert">Expert Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-mono text-primary">Crew Requirements</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="bg-transparent border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => append({ skillCategory: "", count: 1 })}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Role
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-4 bg-background/30 p-3 rounded border border-primary/10">
                      <FormField
                        control={form.control}
                        name={`requiredRoles.${index}.skillCategory`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-muted-foreground font-mono text-xs">Skill Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. React, UX Design" className="bg-background/50 border-primary/20 font-mono text-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`requiredRoles.${index}.count`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel className="text-muted-foreground font-mono text-xs">Count</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" className="bg-background/50 border-primary/20 font-mono text-white text-center" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon"
                        className="mb-0.5 bg-destructive/20 border border-destructive hover:bg-destructive text-destructive-foreground transition-colors"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary/20 hover:bg-primary/40 border border-primary text-primary font-mono uppercase tracking-widest mt-6" disabled={createTeam.isPending}>
                {createTeam.isPending ? "Broadcasting..." : "Establish Fleet"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
