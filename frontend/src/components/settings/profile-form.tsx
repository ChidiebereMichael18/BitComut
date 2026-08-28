"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useFinanceProfile, DEFAULT_FINANCE_PROFILE } from "@/components/finance-profile-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function ProfileForm() {
  const profile = useFinanceProfile()
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)

  const save = () => {
    profile.update({
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
    })
    toast.success("Profile updated", {
      description: "Your display name and email were updated.",
    })
  }

  const appliedName = name.trim() || profile.name
  const initials =
    appliedName
      .split(/\s+/)
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account details as shown across the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{appliedName}</p>
              <p className="text-xs text-muted-foreground">{profile.role}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Finance Team"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance@university.edu"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-role">Role</Label>
              <Input id="profile-role" value={profile.role} disabled />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>Save changes</Button>
            <Button
              variant="outline"
              onClick={() => {
                profile.reset()
                setName(DEFAULT_FINANCE_PROFILE.name)
                setEmail(DEFAULT_FINANCE_PROFILE.email)
                toast.success("Profile reset", {
                  description: "Your profile was restored to the default.",
                })
              }}
            >
              Reset to default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
