import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";

import { useRouter } from "expo-router";

import { QueryState } from "@/core/components/QueryState";
import { useDebouncedValue } from "@/core/hooks/useDebouncedValue";
import { Select, SelectOption } from "@/design-system/ui";
import { SharedLayout } from "@/design-system/ui/layout/SharedLayout";
import { LOOKUP_KIND_LABELS, lookupRoute } from "@/modules/admin/api/lookup/routes";
import { LookupResult, LookupKind } from "@/modules/admin/api/lookup/types";
import { isLookupCandidate, useLookup } from "@/modules/admin/hooks/lookup/useLookup";

import { HistoryPerson } from "../api/api";
import { HistoryList } from "../components/HistoryList";
import { useHistory, useSuggestedPeople } from "../hooks/useHistory";
import { entryKind } from "../lib/describeEntry";

/**
 * The record types the trail can be narrowed to.
 *
 * "Anything" is first and is the default, because arriving with a type already
 * in mind is the unusual case. The rest are the kinds that appear in the trail
 * often enough to be worth a heading; a type with no activity simply shows an
 * empty list, which is a truthful answer rather than a gap.
 */
type KindFilter = LookupKind | "any";

const KIND_FILTERS: SelectOption<KindFilter>[] = [
  { value: "any", label: "Anything" },
  { value: "workspace", label: "Workspaces" },
  { value: "client", label: "Clients" },
  { value: "manager", label: "Managers" },
  { value: "task", label: "Tasks" },
  { value: "checklist", label: "Checklists" },
  { value: "questionnaire", label: "Questionnaires" },
  { value: "message", label: "Messages" },
  { value: "file", label: "Files" },
  { value: "file_request", label: "File requests" },
  { value: "signature_request", label: "Signature requests" },
  { value: "irs_submission", label: "IRS submissions" },
];

/**
 * Browse the audit trail.
 *
 * Recent activity is shown immediately, with no search. The previous version
 * showed nothing until an identifier had been typed, which is backwards for a
 * tool whose purpose is to tell an administrator what has been going on: it
 * could only answer questions they already knew how to ask. What keeps the
 * unscoped view affordable is the page size, not the search box.
 *
 * The search itself takes an email or a name. It resolves through a suggestion
 * list rather than accepting free text, because the trail stores account ids:
 * typing a name into a filter that matches ids would return nothing and read
 * as "this person did nothing", which is the expensive wrong answer here.
 *
 * The same box also takes an identifier. The type dropdown beside it narrows
 * what is being read, and defaults to anything: an id quoted in an email or
 * read out on a call arrives without a type attached, and which of ten
 * collections it belongs to is usually what the investigator came to find out.
 * Making them choose first would demand the answer as the price of asking. So
 * the dropdown is there for the case where they do know -- "show me what has
 * been happening to signature requests" is a question the trail can answer and
 * a name search cannot.
 */
export function HistoryScreen() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const [kind, setKind] = useState<KindFilter>("any");

  // The person the trail is currently scoped to, once one has been picked.
  const [person, setPerson] = useState<HistoryPerson | null>(null);

  // Suggestions are debounced; the trail below is not driven by the raw text
  // at all. A request per keystroke against an append-only collection answers
  // a question nobody has finished asking.
  const debounced = useDebouncedValue(term, 300);

  // An identifier is never a name, so the two searches never run together.
  // Left unguarded, pasting an id would also fire a directory search for a
  // string no person can match, and draw "Nobody matches that" underneath a
  // record that was found perfectly well.
  const isIdentifier = isLookupCandidate(debounced);

  const suggestions = useSuggestedPeople(person || isIdentifier ? "" : debounced);

  const lookup = useLookup(isIdentifier ? debounced : "");

  const record = lookup.data ?? null;

  const {
    entries,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useHistory(
    isIdentifier
      ? // Scoped by the identifier whether or not a record still answers to
        // it. The trail outlives what it describes, and an id that resolves
        // to nothing is often the most interesting thing an investigator can
        // be holding -- refusing to search for it would hide the deletion
        // they came to look at.
        { resourceId: debounced }
      : person
        ? { actorId: person.id }
        : {},
  );

  const people = suggestions.data ?? [];

  // Filtered here rather than sent to the API. The trail stores a route
  // template, not a record type, so the server has no field to match on; the
  // type is something this side derives from the route. The cost is that a
  // page can come back thinner than it went out, which is why the pager below
  // is driven by the API's own has_more rather than by how many rows survived.
  const visible =
    kind === "any" ? entries : entries.filter((entry) => entryKind(entry) === kind);

  const showSuggestions = !person && !isIdentifier && debounced.trim().length >= 2;

  const recordRoute = record ? lookupRoute(record) : null;

  return (
    <SharedLayout title="History">
      <View className="gap-3 px-4 pt-2">
        {person ? (
          <View className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-semibold text-text dark:text-dark-text">
                {person.name || person.email}
              </Text>
              <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {person.email}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setPerson(null);
                setTerm("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear person filter"
              className="rounded-lg bg-primary px-3 py-2"
            >
              <Text className="text-xs font-semibold text-white">Clear</Text>
            </Pressable>
          </View>
        ) : (
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Search by name, email, or ID"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search by name, email, or ID"
            className="rounded-lg border border-border px-3 py-2 text-sm text-text dark:border-dark-border dark:text-dark-text"
          />
        )}

        {isIdentifier ? (
          <ResolvedRecord
            isLoading={lookup.isLoading}
            record={record}
            route={recordRoute}
            onOpen={(to) => router.push(to)}
          />
        ) : null}

        <Select<KindFilter>
          label="Type"
          accessibilityLabel="Filter by record type"
          options={KIND_FILTERS}
          value={kind}
          onChange={setKind}
        />

        {showSuggestions ? (
          <View className="rounded-lg border border-border dark:border-dark-border">
            {suggestions.isLoading ? (
              <Text className="px-3 py-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                Searching…
              </Text>
            ) : people.length === 0 ? (
              <Text className="px-3 py-2 text-xs text-text-secondary dark:text-dark-text-secondary">
                Nobody matches that.
              </Text>
            ) : (
              people.map((candidate) => (
                <Pressable
                  key={candidate.id}
                  onPress={() => setPerson(candidate)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show history for ${candidate.email}`}
                  className="border-b border-border px-3 py-2 last:border-b-0 dark:border-dark-border"
                >
                  <Text className="text-sm text-text dark:text-dark-text">
                    {candidate.name || candidate.email}
                  </Text>
                  {/* The address and the role are both shown because two
                      people at a firm often share a name, and picking the
                      wrong one sends an investigation down the wrong path. */}
                  <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
                    {candidate.email} · {candidate.role}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
          {isIdentifier
            ? "Every recorded action on this record, most recent first."
            : person
              ? "Every recorded action for this person, most recent first."
              : "Recent activity across the firm, most recent first. Denied attempts are highlighted."}
        </Text>

        <QueryState
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => {
            void refetch();
          }}
          isEmpty={!isLoading && visible.length === 0}
          emptyMessage={
            kind !== "any"
              ? // Named separately so the reader knows their own filter caused
                // this, rather than concluding that nothing has happened.
                "No recorded activity of this type."
              : isIdentifier
                ? "No recorded activity for this ID."
                : person
                  ? "No recorded activity for this person."
                  : "No recorded activity yet."
          }
        >
          <HistoryList entries={visible} />

          {hasNextPage ? (
            <Pressable
              onPress={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              accessibilityRole="button"
              accessibilityLabel="Load older activity"
              accessibilityState={{ disabled: isFetchingNextPage }}
              className="mt-2 rounded-lg border border-border px-4 py-2.5 dark:border-dark-border"
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text className="text-center text-sm font-semibold text-text dark:text-dark-text">
                  Load older
                </Text>
              )}
            </Pressable>
          ) : null}
        </QueryState>
      </View>
    </SharedLayout>
  );
}

/**
 * What the pasted identifier turned out to name.
 *
 * Shown above the trail so an investigator can confirm they are reading the
 * right record's history before they read any of it. Without it the entries
 * below are a list of paths and status codes attached to a number, which is
 * exactly as much as they knew before they searched.
 *
 * An id matching nothing is reported as a fact rather than as an error, and
 * the trail is still shown. The audit trail outlives what it describes: an id
 * with activity but no record is a deleted record, which is usually the thing
 * worth looking at rather than the thing to hide.
 */
function ResolvedRecord({
  isLoading,
  record,
  route,
  onOpen,
}: {
  isLoading: boolean;
  record: LookupResult | null;
  route: string | null;
  onOpen: (route: string) => void;
}) {
  if (isLoading) {
    return (
      <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
        Identifying…
      </Text>
    );
  }

  if (!record) {
    return (
      <View className="rounded-lg border border-border px-3 py-2 dark:border-dark-border">
        <Text className="text-sm font-semibold text-text dark:text-dark-text">
          No current record has this ID
        </Text>
        <Text className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
          Any activity recorded against it is still shown below.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-between rounded-lg border border-border px-3 py-2 dark:border-dark-border">
      <View className="flex-1 pr-2">
        <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
          {LOOKUP_KIND_LABELS[record.kind]}
        </Text>
        <Text className="text-sm font-semibold text-text dark:text-dark-text">
          {/* A record can genuinely have no name: an untitled task, a message
              that was only an attachment. The kind above still tells the
              investigator what they are looking at. */}
          {record.label?.trim() || "Untitled"}
        </Text>
        {record.workspace_name ? (
          <Text className="text-xs text-text-secondary dark:text-dark-text-secondary">
            in {record.workspace_name}
          </Text>
        ) : null}
      </View>

      {/* Absent rather than disabled when there is nowhere to go. An
          administrator account has no profile page and a role this build does
          not recognise has none by definition; a greyed-out button would
          suggest a permission problem instead of an absence. */}
      {route ? (
        <Pressable
          onPress={() => onOpen(route)}
          accessibilityRole="button"
          accessibilityLabel="Open this record"
          className="rounded-lg bg-primary px-3 py-2"
        >
          <Text className="text-xs font-semibold text-white">Open</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
