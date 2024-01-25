"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, ChangeEvent, useEffect } from "react";
import useUnixTimeCountDown from "@/hooks/useCountDown";
import { format } from "date-fns";
import {
  Address,
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

import { formatEther, formatUnits } from "viem";

import { TDHLocker } from "@/lib/config";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
export default function Home() {
  const { isConnected, address } = useAccount();

  const [_lockedBalance, setLockedBalance] = useState<bigint>(0n);

  const {
    data: lockedBalance,
    refetch: refectLockedBalance,
    isFetching,
    isSuccess,
  } = useContractRead({
    ...TDHLocker,
    functionName: "lockedBalance",
    args: [isConnected && address ? address : ("" as Address)],
    // args: ["0xf120A19d1460bCFf82E1670842e9dFea9101eed8" as Address],
    watch: true,
  });

  const {
    data: rewardBalance,
    refetch: refectRewardBalance,
    isFetching: isRewardBalFetching,
    isSuccess: isRewardBalSuccess,
  } = useContractRead({
    ...TDHLocker,
    functionName: "rewardBalance",
    args: [isConnected && address ? address : ("" as Address)],
    // args: ["0xf120A19d1460bCFf82E1670842e9dFea9101eed8" as Address],
    watch: true,
  });

  const {
    data: lockTime,
    refetch: refectLockTime,
    isFetching: isLockTimeFetching,
    isSuccess: isLockTimeSuccess,
  } = useContractRead({
    ...TDHLocker,
    functionName: "lockTime",
    args: [isConnected && address ? address : ("" as Address)],
    // args: ["0xf120A19d1460bCFf82E1670842e9dFea9101eed8" as Address],
    watch: true,
  });

  const { formattedTime } = useUnixTimeCountDown(
    isLockTimeSuccess ? Number(lockTime) : 0,
  );

  //   UNLOCKED TOKEN FUNCTION
  const { config: contractWriteConfig } = usePrepareContractWrite({
    ...TDHLocker,
    functionName: "unlockTokens",
    args: [_lockedBalance ? _lockedBalance : 0n],
  });

  const {
    data: unluckTokensInfo,
    write: unlockTokens,
    isLoading: unlockingStarted,
    isSuccess: unlockingFinished,
    error: unLockError,
  } = useContractWrite(contractWriteConfig);

  useEffect(() => {
    lockedBalance && setLockedBalance(lockedBalance);

    unLockError && console.log(unLockError);
    unlockingFinished && console.log(unlockingFinished);
    unlockingStarted && console.log(unlockingStarted);

    unlockingStarted &&
      toast("Unlocking Starting...", {
        description: "Hang on",
        action: {
          label: "Close",
          onClick: () => console.log("Close"),
        },
      });
    unLockError &&
      toast("Unlocking error...", {
        description: "Something went wrong",
        action: {
          label: "Close",
          onClick: () => console.log("Close"),
        },
      });
  }, [lockedBalance, unLockError, unlockingFinished, unlockingStarted]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="flex flex-col w-full gap-6 max-w-sm items-center">
        <div className="flex items-center flex-wrap gap-6 border rounded-lg shadow-md p-4">
          <div className="flex items-center gap-2 border p-3 ">
            <p className="font-semibold">Balance Locked:</p>
            {isConnected ? (
              <div>
                {isFetching ? (
                  <Skeleton className="w-12 h-4" />
                ) : (
                  isSuccess && (
                    <p>
                      {formatEther(_lockedBalance)}
                      {lockedBalance && lockedBalance > 0 ? "" : "0.00"}
                    </p>
                  )
                )}
              </div>
            ) : (
              "Connect Wallet"
            )}
          </div>

          <div className="flex items-center gap-2 border p-3 ">
            <p className="font-semibold">Reward Gained:</p>
            {isConnected ? (
              <div>
                {isRewardBalFetching ? (
                  <Skeleton className="w-12 h-4" />
                ) : (
                  isRewardBalSuccess && (
                    <p>
                      {rewardBalance && formatEther(rewardBalance as bigint)}
                      {rewardBalance && rewardBalance > 0 ? "" : "0.00"}
                    </p>
                  )
                )}
              </div>
            ) : (
              "Connect Wallet"
            )}
          </div>

          <div className="flex items-center gap-2 border p-3 ">
            <p className="font-semibold">Lock Time:</p>
            {isConnected ? (
              <div>
                {isLockTimeFetching ? (
                  <Skeleton className="w-12 h-4" />
                ) : (
                  isLockTimeSuccess && (
                    <p>
                      {lockTime && formattedTime.toString()}
                      {lockTime && lockTime > 0 ? "" : "0.00"}
                    </p>
                  )
                )}
              </div>
            ) : (
              "Connect Wallet"
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="tokenamount">Token amount to unlock</Label>
          <Input
            disabled={
              isConnected && lockedBalance && lockedBalance < 0 ? false : true
            }
            type="number"
            id="tokenamount"
            placeholder="example: 1000"
            value={_lockedBalance > 0n ? formatUnits(_lockedBalance, 18) : 0}
          />
        </div>
        <div>
          {isConnected ? (
            <div>
              {lockedBalance && lockedBalance > 0 ? (
                <Button onClick={lockedBalance > 0 ? unlockTokens : () => {}}>
                  {unlockingStarted ? "Unlocking..." : "Unlock All Tokens "}
                </Button>
              ) : (
                <Button>No tokens found</Button>
              )}
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>
      </div>
    </main>
  );
}